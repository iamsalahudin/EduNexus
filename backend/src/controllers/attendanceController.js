const { Attendance, Student, Timetable, AttendanceAssignment, User, AttendanceLeaveRequest } = require('../models');
const mongoose = require('mongoose');
const { arrayToCSV, setCSVHeaders } = require('../utils/csvExport');

function sendSuccess(res, data = {}, message = '') {
  // If data is an object with known payload keys, merge them at top-level
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return res.json(Object.assign({ success: true, message }, data));
  }
  return res.json({ success: true, message, data });
}

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

function pairMatchesClassSection(pair, className, section) {
  if (!pair) return false;
  const targetClass = String(className || '').trim();
  const targetSection = String(section || '').trim();
  
  const classMatches = targetClass === String(pair.className || '').trim();
  const sectionMatches = !pair.section || targetSection === String(pair.section || '').trim();
  
  return classMatches && sectionMatches;
}

function pairMatchesStudent(pair, student) {
  if (!student) return false;
  return pairMatchesClassSection(pair, student.class, student.section);
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

    return sendSuccess(res, { assignments });
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
    return sendSuccess(res, { assignment });
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
    return sendSuccess(res, { ok: true });
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

      const updatePayload = {
        student: sid,
        date: normalizedDate,
        status: entry.status,
        remarks: entry.remarks || '',
        class: student.class,
        section: student.section
      };

      if (req.user.role === 'Teacher') {
        updatePayload.teacher = req.user.id;
      }

      const rec = await Attendance.findOneAndUpdate(
        { student: sid, date: normalizedDate },
        updatePayload,
        { upsert: true, new: true }
      );
      attendanceRecords.push(rec);
    }

    if (invalid.length > 0 && attendanceRecords.length === 0) {
      return res.status(403).json({ error: 'Some students are not allowed for this teacher', invalid });
    }

    return res.status(201).json({ success: true, records: attendanceRecords, invalid });
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
    } else if (userRole === 'Receptionist') {
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

    return sendSuccess(res, { records });
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

    if (!['Admin', 'Principal', 'HR', 'Teacher', 'Receptionist', 'Student', 'Parent'].includes(userRole)) {
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

    return sendSuccess(res, { summary, totals });
  } catch (err) {
    next(err);
  }
}

async function getAttendanceReport(req, res, next) {
  try {
    const reportType = String(req.query.reportType || req.query.type || 'class-wise').trim();
    const classId = String(req.query.classId || '').trim();
    const fromDate = String(req.query.fromDate || '').trim();
    const toDate = String(req.query.toDate || '').trim();

    const derived = applyPeriodRange(req.query.period, req.query.year, req.query.month);
    const rangeFrom = fromDate || derived?.fromDate || null;
    const rangeTo = toDate || derived?.toDate || null;

    const buildDateFilter = () => {
      const filter = {};
      if (rangeFrom) {
        const d = normalizeDay(rangeFrom);
        if (!d) return null;
        filter.$gte = d;
      }
      if (rangeTo) {
        const d = normalizeDay(rangeTo);
        if (!d) return null;
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        filter.$lte = end;
      }
      return Object.keys(filter).length > 0 ? filter : null;
    };

    const dateFilter = buildDateFilter();
    if (dateFilter === null && (rangeFrom || rangeTo)) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    const attendanceFilter = {};
    if (dateFilter) attendanceFilter.date = dateFilter;
    if (classId) attendanceFilter.class = classId;

    if (reportType === 'class-wise') {
      const { SchoolClass } = require('../models');
      const classes = await SchoolClass.find({ active: { $ne: false } }).select('name').sort({ name: 1 }).lean();
      const report = [];

      for (const cls of classes) {
        const records = await Attendance.find({
          ...attendanceFilter,
          class: cls.name
        }).select('status').lean();

        const total = records.length;
        const present = records.filter((row) => row.status === 'present').length;
        const absent = records.filter((row) => row.status === 'absent').length;
        const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;

        report.push({ class: cls.name, total, present, absent, percentage });
      }

      return res.json({ report });
    }

    if (reportType === 'student-wise') {
      if (!classId) return res.status(400).json({ error: 'classId is required for student-wise reports' });

      const students = await Student.find({ class: classId }).populate('user', 'name').select('user').lean();
      const records = await Attendance.find({
        ...attendanceFilter,
        class: classId
      }).populate('student', 'user').select('student status').lean();

      const report = students.map((student) => {
        const studentId = String(student?._id || student?.user || '');
        const studentRecords = records.filter((record) => String(record?.student?._id || record?.student) === studentId);
        const total = studentRecords.length;
        const present = studentRecords.filter((row) => row.status === 'present').length;
        const absent = studentRecords.filter((row) => row.status === 'absent').length;
        const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;

        return {
          name: student?.user?.name || '-',
          total,
          present,
          absent,
          percentage
        };
      });

      return res.json({ report });
    }

    if (reportType === 'teacher-search') {
      const teachers = await User.find({ role: 'Teacher' }).select('name').sort({ name: 1 }).lean();
      const report = [];

      for (const teacher of teachers) {
        const records = await Attendance.find({
          ...attendanceFilter,
          teacher: teacher._id
        }).select('status').lean();

        const total = records.length;
        const present = records.filter((row) => row.status === 'present').length;
        const absent = records.filter((row) => row.status === 'absent').length;
        const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;

        report.push({ name: teacher.name, total, present, absent, percentage });
      }

      return res.json({ report });
    }

    if (reportType === 'school-trends') {
      const records = await Attendance.find(attendanceFilter).select('date status').sort({ date: 1 }).lean();
      const buckets = new Map();

      for (const record of records) {
        const dateKey = String(record?.date || '').slice(0, 10);
        if (!dateKey) continue;
        if (!buckets.has(dateKey)) {
          buckets.set(dateKey, { date: dateKey, present: 0, absent: 0, late: 0, excused: 0 });
        }
        const bucket = buckets.get(dateKey);
        if (record.status === 'present') bucket.present += 1;
        else if (record.status === 'absent') bucket.absent += 1;
        else if (record.status === 'late') bucket.late += 1;
        else if (record.status === 'excused') bucket.excused += 1;
      }

      const report = [...buckets.values()].map((row) => {
        const total = row.present + row.absent + row.late + row.excused;
        return {
          ...row,
          total,
          percentage: total > 0 ? Number(((row.present / total) * 100).toFixed(1)) : 0
        };
      });

      return res.json({ report });
    }

    return res.status(400).json({ error: 'Invalid reportType' });
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
      const canByScope = scopePairs.some((pair) => pairMatchesClassSection(pair, rec.class, rec.section));
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

    if (!['Admin', 'Principal', 'HR', 'Teacher', 'Receptionist', 'Student', 'Parent'].includes(userRole)) {
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

    return sendSuccess(res, { records });
  } catch (err) {
    next(err);
  }
}

// Leave request APIs
async function createLeaveRequest(req, res, next) {
  try {
    const { fromDate, toDate, type, reason, childId } = req.body;
    let student = null;

    if (req.user.role === 'Student') {
      student = await resolveStudentForUser(req.user);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
    } else if (req.user.role === 'Parent') {
      const requested = String(childId || '').trim();
      if (!requested) return res.status(400).json({ error: 'childId is required for parents' });
      const children = await Student.find({ parents: req.user.id }).select('_id');
      const childIds = children.map((c) => String(c._id));
      if (!childIds.includes(requested)) return res.status(403).json({ error: 'Selected child is not linked to this parent' });
      student = await Student.findById(requested);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
    } else {
      return res.status(403).json({ error: 'Only students or parents may submit leave requests' });
    }

    const from = normalizeDay(fromDate);
    if (!from) return res.status(400).json({ error: 'Invalid fromDate' });
    const to = normalizeDay(toDate || fromDate) || from;

    const reqDoc = new AttendanceLeaveRequest({
      student: student._id,
      user: req.user.id,
      fromDate: from,
      toDate: to,
      type: type || 'full-day',
      reason: reason || ''
    });
    await reqDoc.save();
    res.status(201).json({ request: reqDoc });
  } catch (err) {
    next(err);
  }
}

async function getLeaveRequests(req, res, next) {
  try {
    const userRole = req.user.role;
    const { studentId, status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (userRole === 'Student') {
      const student = await resolveStudentForUser(req.user);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
      filter.student = student._id;
    } else if (userRole === 'Parent') {
      const children = await Student.find({ parents: req.user.id }).select('_id');
      const childIds = children.map((c) => String(c._id));
      if (!childIds.length) return res.json({ requests: [] });
      if (studentId) {
        if (!childIds.includes(String(studentId))) return res.status(403).json({ error: 'Selected child is not linked to this parent' });
        filter.student = new mongoose.Types.ObjectId(studentId);
      } else {
        filter.student = { $in: childIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }
    } else if (['Teacher', 'Admin', 'Principal'].includes(userRole)) {
      if (studentId) filter.student = new mongoose.Types.ObjectId(studentId);
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const requests = await AttendanceLeaveRequest.find(filter).populate('student', 'firstName lastName studentId class section').sort({ createdAt: -1 }).lean();
    res.json({ requests });
  } catch (err) {
    next(err);
  }
}

async function editLeaveRequest(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const rec = await AttendanceLeaveRequest.findById(id);
    if (!rec) return res.status(404).json({ error: 'Leave request not found' });

    const userRole = req.user.role;

    if (userRole === 'Student' || userRole === 'Parent') {
      // owner may edit/cancel only when pending
      const student = await resolveStudentForUser(req.user);
      const ownerId = student ? String(student._id) : null;
      if (userRole === 'Parent') {
        // parent must be linked
        const children = await Student.find({ parents: req.user.id }).select('_id');
        const childIds = children.map((c) => String(c._id));
        if (!childIds.includes(String(rec.student))) return res.status(403).json({ error: 'Not allowed' });
      } else if (ownerId && ownerId !== String(rec.student)) {
        return res.status(403).json({ error: 'Not allowed' });
      }

      if (String(rec.status) !== 'pending') return res.status(400).json({ error: 'Only pending requests can be edited or cancelled' });

      const { fromDate, toDate, type, reason, status } = req.body;
      if (fromDate) rec.fromDate = normalizeDay(fromDate) || rec.fromDate;
      if (toDate) rec.toDate = normalizeDay(toDate) || rec.toDate;
      if (type) rec.type = type;
      if (reason !== undefined) rec.reason = reason;
      // allow cancelling by owner
      if (status && status === 'cancelled') rec.status = 'cancelled';
      await rec.save();
      return res.json({ request: rec });
    }

    if (['Teacher', 'Admin', 'Principal'].includes(userRole)) {
      // approver actions: change status and add remarks
      const { status, approverRemarks } = req.body;
      if (status && ['approved', 'rejected'].includes(status)) {
        rec.status = status;
        rec.approver = req.user.id;
      }
      if (approverRemarks !== undefined) rec.approverRemarks = approverRemarks;
      await rec.save();
      return res.json({ request: rec });
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  } catch (err) {
    next(err);
  }
}

async function getClassAttendanceOverview(req, res, next) {
  try {
    const dateInput = req.query.date ? new Date(req.query.date) : new Date();
    if (Number.isNaN(dateInput.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }
    const day = new Date(dateInput);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);

    const [perClassTotals, perClassAttendance] = await Promise.all([
      Student.aggregate([
        { $match: { status: 'incampus' } },
        { $group: { _id: '$class', total: { $sum: 1 } } }
      ]),
      Attendance.aggregate([
        { $match: { date: { $gte: day, $lt: nextDay } } },
        { $group: { _id: { class: '$class', status: '$status' }, count: { $sum: 1 } } }
      ])
    ]);

    const totals = new Map(perClassTotals.map((r) => [String(r._id || ''), r.total]));
    const stats = new Map();
    for (const r of perClassAttendance) {
      const key = String(r._id?.class || '');
      const entry = stats.get(key) || { present: 0, absent: 0, late: 0, excused: 0 };
      const status = r._id?.status;
      if (status === 'present') entry.present += r.count;
      else if (status === 'absent') entry.absent += r.count;
      else if (status === 'late') entry.late += r.count;
      else if (status === 'excused') entry.excused += r.count;
      stats.set(key, entry);
    }

    const classKeys = new Set([...totals.keys(), ...stats.keys()]);
    const overview = Array.from(classKeys).map((cls) => {
      const total = totals.get(cls) || 0;
      const s = stats.get(cls) || { present: 0, absent: 0, late: 0, excused: 0 };
      const percentage = total > 0 ? Number(((s.present / total) * 100).toFixed(1)) : 0;
      return { class: cls, total, present: s.present, absent: s.absent, late: s.late, excused: s.excused, percentage };
    });
    overview.sort((a, b) => String(a.class).localeCompare(String(b.class), undefined, { numeric: true }));

    res.json({ date: day.toISOString().slice(0, 10), overview });
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
  getAttendanceReport,
  getClassAttendanceOverview,
  updateAttendance,
  deleteAttendance,
  exportAttendance
  ,
  createLeaveRequest,
  getLeaveRequests,
  editLeaveRequest
};
