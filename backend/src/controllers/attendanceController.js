const { Attendance, Student, Timetable, AttendanceAssignment, User } = require('../models');
const mongoose = require('mongoose');
const { arrayToCSV, setCSVHeaders } = require('../utils/csvExport');

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

function getTeacherProfileScope(user) {
  const profile = user.profile || {};
  const cls = profile.class || profile.classId || profile.assignedClass;
  const section = profile.section || profile.assignedSection;
  return {
    class: cls ? String(cls) : null,
    section: section ? String(section) : null
  };
}

function normalizePair(className, section) {
  const normalizedClass = String(className || '').trim();
  const normalizedSection = String(section || '').trim();
  if (!normalizedClass) return null;
  return {
    className: normalizedClass,
    section: normalizedSection,
  };
}

function pairKey(pair) {
  return `${String(pair?.className || '').trim().toLowerCase()}::${String(pair?.section || '').trim().toLowerCase()}`;
}

function pairMatchesStudent(pair, student) {
  if (!pair || !student) return false;
  const studentClass = String(student.class || '').trim();
  const studentSection = String(student.section || '').trim();
  return studentClass === String(pair.className || '').trim() && studentSection === String(pair.section || '').trim();
}

function buildTeacherScopeFilter(pairs) {
  const scopePairs = Array.isArray(pairs) ? pairs.map((pair) => normalizePair(pair?.className, pair?.section)).filter(Boolean) : [];
  if (!scopePairs.length) return null;

  return {
    $or: scopePairs.map((pair) => {
      const clause = { class: pair.className };
      if (pair.section) clause.section = pair.section;
      return clause;
    })
  };
}

async function resolveTeacherScopePairs(user) {
  const teacherId = String(user?.id || '').trim();
  if (!teacherId) return [];

  const assignments = await AttendanceAssignment.find({ teacher: new mongoose.Types.ObjectId(teacherId) })
    .select('className section')
    .sort({ className: 1, section: 1 })
    .lean();

  const assignmentPairs = assignments
    .map((assignment) => normalizePair(assignment?.className, assignment?.section))
    .filter(Boolean);

  if (assignmentPairs.length) {
    return assignmentPairs;
  }

  const timetable = await Timetable.findOne({
    isActive: true,
    status: { $ne: 'archived' },
    'slots.teacher': new mongoose.Types.ObjectId(teacherId)
  })
    .select('slots')
    .lean();

  const teacherSlots = (Array.isArray(timetable?.slots) ? timetable.slots : [])
    .filter((slot) => String(slot?.teacher || '') === teacherId && String(slot?.class || '').trim())
    .sort((a, b) => timeToMinutes(a?.startTime) - timeToMinutes(b?.startTime));

  const timetablePairs = [];
  const seen = new Set();
  for (const slot of teacherSlots) {
    const pair = normalizePair(slot?.class, slot?.section);
    if (!pair) continue;
    const key = pairKey(pair);
    if (seen.has(key)) continue;
    seen.add(key);
    timetablePairs.push(pair);
  }

  if (timetablePairs.length) {
    return timetablePairs;
  }

  const profilePair = getTeacherProfileScope(user);
  return profilePair.class ? [normalizePair(profilePair.class, profilePair.section)].filter(Boolean) : [];
}

function timeToMinutes(value) {
  const [hh, mm] = String(value || '').split(':').map((v) => parseInt(v, 10));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return Number.MAX_SAFE_INTEGER;
  return hh * 60 + mm;
}

function applyPeriodRange(period, year, month) {
  const now = new Date();
  const resolvedYear = Number(year) || now.getFullYear();

  if (period === 'year') {
    return {
      fromDate: `${resolvedYear}-01-01`,
      toDate: `${resolvedYear}-12-31`
    };
  }

  if (period === 'month') {
    const resolvedMonth = String(month || now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(resolvedYear, Number(resolvedMonth), 0).getDate();
    return {
      fromDate: `${resolvedYear}-${resolvedMonth}-01`,
      toDate: `${resolvedYear}-${resolvedMonth}-${String(lastDay).padStart(2, '0')}`
    };
  }

  return null;
}

async function listAttendanceAssignments(req, res, next) {
  try {
    const assignments = await AttendanceAssignment.find({})
      .populate('teacher', 'name email role')
      .sort({ className: 1, section: 1 })
      .lean();

    res.json({ assignments });
  } catch (err) {
    next(err);
  }
}

async function saveAttendanceAssignment(req, res, next) {
  try {
    const assignmentId = String(req.params.id || req.body.id || '').trim();
    const teacherId = String(req.body.teacherId || req.body.teacher || '').trim();
    const pair = normalizePair(req.body.className || req.body.class, req.body.section);

    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher is required' });
    }
    if (!pair) {
      return res.status(400).json({ error: 'Class and section are required' });
    }

    const teacher = await User.findById(teacherId).select('_id role name email').lean();
    if (!teacher || String(teacher.role || '').toLowerCase() !== 'teacher') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const existing = assignmentId
      ? await AttendanceAssignment.findById(assignmentId)
      : await AttendanceAssignment.findOne({ className: pair.className, section: pair.section });

    if (!existing && assignmentId) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const conflicting = await AttendanceAssignment.findOne({
      className: pair.className,
      section: pair.section,
      _id: { $ne: existing?._id }
    }).select('_id');

    if (conflicting) {
      return res.status(409).json({ error: 'This class and section are already assigned to a teacher' });
    }

    const payload = {
      teacher: teacher._id,
      className: pair.className,
      section: pair.section,
    };

    const assignment = existing || new AttendanceAssignment(payload);
    assignment.teacher = payload.teacher;
    assignment.className = payload.className;
    assignment.section = payload.section;
    await assignment.save();

    await assignment.populate('teacher', 'name email role');
    res.json({ assignment });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'This class and section are already assigned to a teacher' });
    }
    next(err);
  }
}

async function deleteAttendanceAssignment(req, res, next) {
  try {
    const deleted = await AttendanceAssignment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
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

    const teacherScope = req.user.role === 'Teacher' ? await resolveTeacherScopePairs(req.user) : [];

    if (req.user.role === 'Teacher' && teacherScope.length === 0) {
      return res.status(403).json({ error: 'Teacher class scope not configured. Assign class teacher scope first.' });
    }

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
        const isAllowed = teacherScope.some((pair) => pairMatchesStudent(pair, student));
        if (!isAllowed) {
          invalid.push({ studentId: sid, reason: 'Student not in assigned class' });
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
    const { studentId, classId, childId, date } = req.query;
    let { fromDate, toDate, period, year, month } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};

    const derived = applyPeriodRange(period, year, month);
    if (derived) {
      fromDate = fromDate || derived.fromDate;
      toDate = toDate || derived.toDate;
    }

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
      const scopePairs = await resolveTeacherScopePairs(req.user);
      const scopeFilter = buildTeacherScopeFilter(scopePairs);
      if (!scopeFilter) {
        return res.json({ records: [] });
      }
      filter.$and = filter.$and || [];
      filter.$and.push(scopeFilter);
    } else if (userRole === 'Student') {
      const student = await resolveStudentForUser(req.user);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
      filter.student = student._id;
    } else if (userRole === 'Parent') {
      const children = await Student.find({ parents: userId }).select('_id');
      const childIds = children.map((c) => String(c._id));
      if (!childIds.length) {
        return res.json({ records: [], meta: { message: 'No linked children found' } });
      }

      const requestedChildId = String(studentId || childId || '').trim();
      if (requestedChildId) {
        if (!childIds.includes(requestedChildId)) {
          return res.status(403).json({ error: 'Selected child is not linked to this parent' });
        }
        filter.student = new mongoose.Types.ObjectId(requestedChildId);
      } else {
        filter.student = { $in: childIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }
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
    const { classId, childId, studentId } = req.query;
    let { fromDate, toDate, period, year, month } = req.query;
    const userRole = req.user.role;

    if (!['Admin', 'Principal', 'HR', 'Teacher', 'Reception', 'Student', 'Parent'].includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const derived = applyPeriodRange(period, year, month);
    if (derived) {
      fromDate = fromDate || derived.fromDate;
      toDate = toDate || derived.toDate;
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
      const scopePairs = await resolveTeacherScopePairs(req.user);
      const scopeFilter = buildTeacherScopeFilter(scopePairs);
      if (!scopeFilter) {
        return res.json({ summary: [], totals: { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0, percentage: 0 } });
      }
      matchStage.$and = matchStage.$and || [];
      matchStage.$and.push(scopeFilter);
    } else if (userRole === 'Student') {
      const student = await resolveStudentForUser(req.user);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
      matchStage.student = student._id;
    } else if (userRole === 'Parent') {
      const children = await Student.find({ parents: req.user.id }).select('_id');
      const childIds = children.map((row) => String(row._id));
      if (!childIds.length) {
        return res.json({
          summary: [],
          totals: { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0, percentage: 0 }
        });
      }
      const requested = String(studentId || childId || '').trim();
      if (requested) {
        if (!childIds.includes(requested)) return res.status(403).json({ error: 'Selected child is not linked to this parent' });
        matchStage.student = new mongoose.Types.ObjectId(requested);
      } else {
        matchStage.student = { $in: childIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }
    } else if (['Admin', 'Principal', 'HR', 'Reception'].includes(userRole)) {
      if (classId) matchStage.class = classId;
      if (studentId) matchStage.student = new mongoose.Types.ObjectId(studentId);
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
          },
          excusedDays: {
            $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] }
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
          excusedDays: 1,
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] }, 2]
          }
        }
      }
    ]);

    const totals = summary.reduce(
      (acc, item) => {
        acc.totalDays += item.totalDays || 0;
        acc.presentDays += item.presentDays || 0;
        acc.absentDays += item.absentDays || 0;
        acc.lateDays += item.lateDays || 0;
        acc.excusedDays += item.excusedDays || 0;
        return acc;
      },
      { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, excusedDays: 0 }
    );

    totals.percentage = totals.totalDays
      ? Number(((totals.presentDays / totals.totalDays) * 100).toFixed(2))
      : 0;

    res.json({ summary, totals });
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

    // teacher can modify within scope or owner; admin/principal can always modify
    if (req.user.role === 'Teacher') {
      const scopePairs = await resolveTeacherScopePairs(req.user);
      const canByScope = scopePairs.some((pair) => String(rec.class || '') === pair.className && String(rec.section || '') === String(pair.section || ''));
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

// Export attendance records as CSV
async function exportAttendance(req, res, next) {
  try {
    const { classId, childId, studentId, format = 'csv' } = req.query;
    let { fromDate, toDate, period, year, month } = req.query;
    const userRole = req.user.role;

    if (!['Admin', 'Principal', 'HR', 'Teacher', 'Reception', 'Student', 'Parent'].includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    let filter = {};

    const derived = applyPeriodRange(period, year, month);
    if (derived) {
      fromDate = fromDate || derived.fromDate;
      toDate = toDate || derived.toDate;
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

    if (userRole === 'Teacher') {
      const scopePairs = await resolveTeacherScopePairs(req.user);
      const scopeFilter = buildTeacherScopeFilter(scopePairs);
      if (!scopeFilter) {
        const filename = `attendance_${fromDate || 'all'}_to_${toDate || 'all'}.csv`;
        setCSVHeaders(res, filename);
        return res.send('Date,Student ID,First Name,Last Name,Class,Section,Status,Marked By,Remarks\n');
      }
      filter.$and = filter.$and || [];
      filter.$and.push(scopeFilter);
    } else if (userRole === 'Student') {
      const student = await resolveStudentForUser(req.user);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
      filter.student = student._id;
    } else if (userRole === 'Parent') {
      const children = await Student.find({ parents: req.user.id }).select('_id');
      const childIds = children.map((row) => String(row._id));
      if (!childIds.length) {
        return res.status(404).json({ error: 'No linked children found' });
      }
      const requested = String(studentId || childId || '').trim();
      if (requested) {
        if (!childIds.includes(requested)) return res.status(403).json({ error: 'Selected child is not linked to this parent' });
        filter.student = new mongoose.Types.ObjectId(requested);
      } else {
        filter.student = { $in: childIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }
    } else {
      if (classId) filter.class = classId;
      if (studentId) filter.student = new mongoose.Types.ObjectId(studentId);
    }

    const records = await Attendance.find(filter)
      .populate('student', 'firstName lastName studentId class section')
      .populate('teacher', 'name email')
      .sort({ date: -1, student: 1 })
      .limit(5000)
      .lean();

    if (format === 'csv') {
      const headers = [
        { key: 'date', label: 'Date' },
        { key: 'student.studentId', label: 'Student ID' },
        { key: 'student.firstName', label: 'First Name' },
        { key: 'student.lastName', label: 'Last Name' },
        { key: 'class', label: 'Class' },
        { key: 'section', label: 'Section' },
        { key: 'status', label: 'Status' },
        { key: 'teacher.name', label: 'Marked By' },
        { key: 'remarks', label: 'Remarks' }
      ];

      const csv = arrayToCSV(records, headers);
      const filename = `attendance_${fromDate || 'all'}_to_${toDate || 'all'}.csv`;

      setCSVHeaders(res, filename);
      return res.send(csv);
    }

    res.json({ records });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAttendanceAssignments,
  saveAttendanceAssignment,
  deleteAttendanceAssignment,
  markAttendance,
  getAttendance,
  getAttendanceSummary,
  updateAttendance,
  deleteAttendance,
  exportAttendance
};
