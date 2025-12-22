const { Attendance, Student } = require('../models');
const mongoose = require('mongoose');

// Teacher marks attendance for their class/section (bulk)
async function markAttendance(req, res, next) {
  try {
    const { studentIds, date, status } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || !date || !status) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const attendanceRecords = [];
    for (const sid of studentIds) {
      const student = await Student.findById(sid);
      if (!student) continue;

      const rec = await Attendance.findOneAndUpdate(
        { student: sid, date: new Date(date).toDateString() },
        {
          student: sid,
          date: new Date(date),
          status,
          teacher: req.user.id,
          class: student.class,
          section: student.section
        },
        { upsert: true, new: true }
      );
      attendanceRecords.push(rec);
    }

    res.status(201).json({ records: attendanceRecords });
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

    if (date) filter.date = new Date(date);
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }

    // Role-based filtering
    if (userRole === 'Teacher') {
      filter.teacher = new mongoose.Types.ObjectId(userId);
    } else if (userRole === 'Student') {
      const student = await Student.findOne({ _id: userId });
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

    if (!['Admin', 'Principal', 'HR', 'Teacher'].includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    let matchStage = {};
    if (classId) matchStage.class = classId;
    if (fromDate || toDate) {
      matchStage.date = {};
      if (fromDate) matchStage.date.$gte = new Date(fromDate);
      if (toDate) matchStage.date.$lte = new Date(toDate);
    }
    if (userRole === 'Teacher') {
      matchStage.teacher = new mongoose.Types.ObjectId(req.user.id);
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
    if (req.user.role === 'Teacher' && rec.teacher.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (status) rec.status = status;
    if (remarks) rec.remarks = remarks;
    await rec.save();
    res.json({ record: rec });
  } catch (err) {
    next(err);
  }
}

module.exports = { markAttendance, getAttendance, getAttendanceSummary, updateAttendance };
