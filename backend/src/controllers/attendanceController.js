const { Attendance, Student } = require('../models');
const mongoose = require('mongoose');

function normalizeDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

async function resolveStudentForUser(user) {
  // Legacy/assumed mapping: Student _id == User _id
  let student = await Student.findOne({ _id: user.id });
  if (student) return student;

  // Optional mapping via user.profile
  const profile = user.profile || {};
  if (profile.studentRef) {
    student = await Student.findById(profile.studentRef);
    if (student) return student;
  }
  if (profile.studentId) {
    student = await Student.findOne({ studentId: String(profile.studentId) });
    if (student) return student;
  }
  return null;
}

function getTeacherScope(user) {
  const profile = user.profile || {};
  const cls = profile.class || profile.classId || profile.assignedClass;
  const section = profile.section || profile.assignedSection;
  return {
    class: cls ? String(cls) : null,
    section: section ? String(section) : null
  };
}

// Teacher marks attendance for their class/section (bulk)
async function markAttendance(req, res, next) {
  try {
    const { studentIds, entries, date, status } = req.body;
    const normalizedDate = normalizeDay(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const hasEntries = Array.isArray(entries) && entries.length > 0;
    const hasStudentIds = Array.isArray(studentIds) && studentIds.length > 0;
    if ((!hasEntries && !hasStudentIds) || (hasStudentIds && !status)) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const teacherScope = req.user.role === 'Teacher' ? getTeacherScope(req.user) : { class: null, section: null };

    const normalizedEntries = hasEntries
      ? entries.map((e) => ({ studentId: e.studentId, status: e.status, remarks: e.remarks }))
      : studentIds.map((sid) => ({ studentId: sid, status, remarks: '' }));

    const invalid = [];
    const attendanceRecords = [];

    for (const entry of normalizedEntries) {
      const sid = entry.studentId;
      const student = await Student.findById(sid);
      if (!student) {
        invalid.push({ studentId: sid, reason: 'Student not found' });
        continue;
      }

      if (req.user.role === 'Teacher') {
        if (teacherScope.class && String(student.class) !== teacherScope.class) {
          invalid.push({ studentId: sid, reason: 'Student not in assigned class' });
          continue;
        }
        if (teacherScope.section && String(student.section || '') !== teacherScope.section) {
          invalid.push({ studentId: sid, reason: 'Student not in assigned section' });
          continue;
        }
      }

      const rec = await Attendance.findOneAndUpdate(
        { student: sid, date: normalizedDate },
        {
          student: sid,
          date: normalizedDate,
          status: entry.status,
          remarks: entry.remarks || '',
          teacher: req.user.id,
          class: student.class,
          section: student.section
        },
        { upsert: true, new: true }
      );
      attendanceRecords.push(rec);
    }

    if (invalid.length > 0 && attendanceRecords.length === 0) {
      return res.status(403).json({ error: 'Some students are not allowed for this teacher', invalid });
    }

    res.status(201).json({ records: attendanceRecords, invalid });
  } catch (err) {
    next(err);
  }
}

// Get attendance records based on role
async function getAttendance(req, res, next) {
  try {
    const { studentId, classId, date, fromDate, toDate } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};

    if (date) {
      const d = normalizeDay(date);
      if (!d) return res.status(400).json({ error: 'Invalid date' });
      filter.date = d;
    }
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) {
        const d = normalizeDay(fromDate);
        if (!d) return res.status(400).json({ error: 'Invalid fromDate' });
        filter.date.$gte = d;
      }
      if (toDate) {
        const d = normalizeDay(toDate);
        if (!d) return res.status(400).json({ error: 'Invalid toDate' });
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Role-based filtering
    if (userRole === 'Teacher') {
      const scope = getTeacherScope(req.user);
      if (scope.class) {
        filter.class = scope.class;
        if (scope.section) filter.section = scope.section;
      } else {
        filter.teacher = new mongoose.Types.ObjectId(userId);
      }
    } else if (userRole === 'Student') {
      const student = await resolveStudentForUser(req.user);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
      filter.student = student._id;
    } else if (userRole === 'Parent') {
      const children = await Student.find({ parents: userId });
      const childIds = children.map((c) => c._id);
      filter.student = { $in: childIds };
    } else if (userRole === 'Reception') {
      if (classId) filter.class = classId;
    } else if (['Admin', 'Principal', 'HR'].includes(userRole)) {
      if (classId) filter.class = classId;
      if (studentId) filter.student = new mongoose.Types.ObjectId(studentId);
    }

    const records = await Attendance.find(filter)
      .populate('student', 'firstName lastName studentId class section')
      .populate('teacher', 'name email')
      .sort({ date: -1 })
      .limit(500);

    res.json({ records });
  } catch (err) {
    next(err);
  }
}

// Get attendance summary/statistics with aggregation
async function getAttendanceSummary(req, res, next) {
  try {
    const { classId, fromDate, toDate } = req.query;
    const userRole = req.user.role;

    if (!['Admin', 'Principal', 'HR', 'Teacher', 'Reception'].includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    let matchStage = {};
    if (classId) matchStage.class = classId;
    if (fromDate || toDate) {
      matchStage.date = {};
      if (fromDate) {
        const d = normalizeDay(fromDate);
        if (!d) return res.status(400).json({ error: 'Invalid fromDate' });
        matchStage.date.$gte = d;
      }
      if (toDate) {
        const d = normalizeDay(toDate);
        if (!d) return res.status(400).json({ error: 'Invalid toDate' });
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        matchStage.date.$lte = end;
      }
    }
    if (userRole === 'Teacher') {
      const scope = getTeacherScope(req.user);
      if (scope.class) {
        matchStage.class = scope.class;
        if (scope.section) matchStage.section = scope.section;
      } else {
        matchStage.teacher = new mongoose.Types.ObjectId(req.user.id);
      }
    }

    const summary = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$student',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          student: '$studentInfo',
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] }, 2]
          }
        }
      }
    ]);

    res.json({ summary });
  } catch (err) {
    next(err);
  }
}

// Update single attendance record
async function updateAttendance(req, res, next) {
  try {
    const { status, remarks } = req.body;
    const rec = await Attendance.findById(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Not found' });

    // only teacher who marked or admin can modify
    if (req.user.role === 'Teacher') {
      const scope = getTeacherScope(req.user);
      const canByScope = scope.class && String(rec.class || '') === scope.class && (!scope.section || String(rec.section || '') === scope.section);
      const canByOwner = rec.teacher && rec.teacher.toString() === req.user.id.toString();
      if (!canByScope && !canByOwner) return res.status(403).json({ error: 'Forbidden' });
    }

    if (status) rec.status = status;
    if (remarks) rec.remarks = remarks;
    await rec.save();
    res.json({ record: rec });
  } catch (err) {
    next(err);
  }
}

async function deleteAttendance(req, res, next) {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { markAttendance, getAttendance, getAttendanceSummary, updateAttendance, deleteAttendance };
