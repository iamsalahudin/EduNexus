const mongoose = require('mongoose');
const { StaffAttendance } = require('../models');

function normalizeDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

async function markStaffAttendance(req, res, next) {
  try {
    const { date, status, remarks, userId } = req.body;
    const normalizedDate = normalizeDay(date);
    if (!normalizedDate) return res.status(400).json({ error: 'Invalid date' });

    const canMarkOthers = ['Admin', 'HR', 'Principal'].includes(req.user.role);
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
    const { userId, date, fromDate, toDate } = req.query;
    const userRole = req.user.role;

    const filter = {};

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

    if (['Admin', 'HR', 'Principal'].includes(userRole)) {
      if (userId) filter.user = new mongoose.Types.ObjectId(userId);
    } else {
      // Teacher/staff self only
      filter.user = new mongoose.Types.ObjectId(req.user.id);
    }

    const records = await StaffAttendance.find(filter)
      .populate('user', 'name email role')
      .populate('markedBy', 'name email')
      .sort({ date: -1 })
      .limit(500);

    res.json({ records });
  } catch (err) {
    next(err);
  }
}

async function getStaffAttendanceSummary(req, res, next) {
  try {
    const { fromDate, toDate, userId } = req.query;
    const userRole = req.user.role;

    const match = {};
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

    if (['Admin', 'HR', 'Principal'].includes(userRole)) {
      if (userId) match.user = new mongoose.Types.ObjectId(userId);
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

    res.json({ summary });
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
    const canManage = ['Admin', 'HR', 'Principal'].includes(userRole);
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

module.exports = {
  markStaffAttendance,
  getStaffAttendance,
  getStaffAttendanceSummary,
  updateStaffAttendance,
  deleteStaffAttendance
};
