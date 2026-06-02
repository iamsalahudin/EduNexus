const mongoose = require('mongoose');
const { StaffAttendance, User } = require('../models');
const { arrayToCSV, setCSVHeaders } = require('../utils/csvExport');

function sendSuccess(res, data = {}, message = '') {
  return res.json({ success: true, message, data });
}

function normalizeDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
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

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveRoleUserIds(role) {
  const roleText = String(role || '').trim();
  if (!roleText) return null;

  const users = await User.find({ role: new RegExp(`^${escapeRegex(roleText)}$`, 'i') })
    .select('_id')
    .lean();

  return users.map((user) => String(user._id));
}

async function markStaffAttendance(req, res, next) {
  try {
    const { date, status, remarks, userId } = req.body;
    const normalizedDate = normalizeDay(date);
    if (!normalizedDate) return res.status(400).json({ error: 'Invalid date' });

    const canMarkOthers = ['Admin', 'Principal', 'Receptionist'].includes(req.user.role);
    const targetUserId = canMarkOthers && userId ? userId : req.user.id;

    if (!canMarkOthers && userId && userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const record = await StaffAttendance.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(targetUserId), date: normalizedDate },
      {
        user: targetUserId,
        date: normalizedDate,
        status,
        remarks: remarks || '',
        markedBy: req.user.id
      },
      { upsert: true, new: true }
    )
      .populate('user', 'name email role')
      .populate('markedBy', 'name email');

    res.status(201).json({ record });
  } catch (err) {
    next(err);
  }
}

async function getStaffAttendance(req, res, next) {
  try {
    const { userId, date, role } = req.query;
    let { fromDate, toDate, period, year, month } = req.query;
    const userRole = req.user.role;

    const filter = {};
    const roleUserIds = await resolveRoleUserIds(role);

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

    if (['Admin', 'HR', 'Principal', 'Receptionist'].includes(userRole)) {
      if (Array.isArray(roleUserIds)) {
        filter.user = { $in: roleUserIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }
      if (userId) filter.user = new mongoose.Types.ObjectId(userId);

      if (Array.isArray(roleUserIds) && userId && !roleUserIds.includes(String(userId))) {
        return sendSuccess(res, { records: [] });
      }
    } else {
      // Teacher/staff self only
      filter.user = new mongoose.Types.ObjectId(req.user.id);
    }

    const records = await StaffAttendance.find(filter)
      .populate('user', 'name email role')
      .populate('markedBy', 'name email')
      .sort({ date: -1 })
      .limit(500);
    return sendSuccess(res, { records });
  } catch (err) {
    next(err);
  }
}

async function getStaffAttendanceSummary(req, res, next) {
  try {
    let { fromDate, toDate, userId, role, period, year, month } = req.query;
    const userRole = req.user.role;

    const match = {};
    const roleUserIds = await resolveRoleUserIds(role);

    const derived = applyPeriodRange(period, year, month);
    if (derived) {
      fromDate = fromDate || derived.fromDate;
      toDate = toDate || derived.toDate;
    }
    if (fromDate || toDate) {
      match.date = {};
      if (fromDate) {
        const d = normalizeDay(fromDate);
        if (!d) return res.status(400).json({ error: 'Invalid fromDate' });
        match.date.$gte = d;
      }
      if (toDate) {
        const d = normalizeDay(toDate);
        if (!d) return res.status(400).json({ error: 'Invalid toDate' });
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }

    if (['Admin', 'HR', 'Principal', 'Receptionist'].includes(userRole)) {
      if (Array.isArray(roleUserIds)) {
        match.user = { $in: roleUserIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }
      if (userId) match.user = new mongoose.Types.ObjectId(userId);

      if (Array.isArray(roleUserIds) && userId && !roleUserIds.includes(String(userId))) {
        return res.json({ summary: { present: 0, absent: 0, late: 0, leave: 0, total: 0 }, perUser: [] });
      }
    } else {
      match.user = new mongoose.Types.ObjectId(req.user.id);
    }

    const buckets = await StaffAttendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
    for (const b of buckets) {
      summary[b._id] = b.count;
      summary.total += b.count;
    }

    let perUser = [];
    if (['Admin', 'HR', 'Principal', 'Reception'].includes(userRole)) {
      perUser = await StaffAttendance.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$user',
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
            leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$user._id',
            name: '$user.name',
            role: '$user.role',
            total: 1,
            present: 1,
            absent: 1,
            late: 1,
            leave: 1,
            percentage: {
              $cond: [
                { $gt: ['$total', 0] },
                { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2] },
                0
              ]
            }
          }
        },
        { $sort: { name: 1 } }
      ]);
    }

    return sendSuccess(res, { summary, perUser });
  } catch (err) {
    next(err);
  }
}

async function updateStaffAttendance(req, res, next) {
  try {
    const { status, remarks } = req.body;
    const rec = await StaffAttendance.findById(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Not found' });

    const userRole = req.user.role;
    const isOwner = rec.user.toString() === req.user.id.toString();
    const canManage = ['Admin', 'Principal'].includes(userRole);
    if (!isOwner && !canManage) return res.status(403).json({ error: 'Forbidden' });

    if (status) rec.status = status;
    if (remarks !== undefined) rec.remarks = remarks;
    await rec.save();

    await rec.populate('user', 'name email role');
    await rec.populate('markedBy', 'name email');
    res.json({ record: rec });
  } catch (err) {
    next(err);
  }
}

async function deleteStaffAttendance(req, res, next) {
  try {
    if (!['Admin', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await StaffAttendance.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// Export staff attendance records as CSV
async function exportStaffAttendance(req, res, next) {
  try {
    const { userId, role, format = 'csv' } = req.query;
    let { fromDate, toDate, period, year, month } = req.query;
    const userRole = req.user.role;

    if (!['Admin', 'HR', 'Principal', 'Receptionist'].includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions for export' });
    }

    const filter = {};
    const roleUserIds = await resolveRoleUserIds(role);

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

    if (Array.isArray(roleUserIds)) {
      filter.user = { $in: roleUserIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    if (userId) {
      if (Array.isArray(roleUserIds) && !roleUserIds.includes(String(userId))) {
        const filename = `staff_attendance_${fromDate || 'all'}_to_${toDate || 'all'}.csv`;
        setCSVHeaders(res, filename);
        return res.send('Date,Staff Name,Email,Role,Status,Marked By,Remarks\n');
      }
      filter.user = new mongoose.Types.ObjectId(userId);
    }

    const records = await StaffAttendance.find(filter)
      .populate('user', 'name email role')
      .populate('markedBy', 'name email')
      .sort({ date: -1, user: 1 })
      .limit(5000)
      .lean();

    if (format === 'csv') {
      const headers = [
        { key: 'date', label: 'Date' },
        { key: 'user.name', label: 'Staff Name' },
        { key: 'user.email', label: 'Email' },
        { key: 'user.role', label: 'Role' },
        { key: 'status', label: 'Status' },
        { key: 'markedBy.name', label: 'Marked By' },
        { key: 'remarks', label: 'Remarks' }
      ];

      const csv = arrayToCSV(records, headers);
      const filename = `staff_attendance_${fromDate || 'all'}_to_${toDate || 'all'}.csv`;

      setCSVHeaders(res, filename);
      return res.send(csv);
    }
    return sendSuccess(res, { records });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  markStaffAttendance,
  getStaffAttendance,
  getStaffAttendanceSummary,
  updateStaffAttendance,
  deleteStaffAttendance,
  exportStaffAttendance
};
