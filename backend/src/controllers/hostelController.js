const mongoose = require('mongoose');
const { Hostel, HostelRoom, HostelResident, HostelFee, Student } = require('../models');

function toObjectId(value) {
  try {
    return new mongoose.Types.ObjectId(value);
  } catch {
    return null;
  }
}

function toBool(value) {
  return String(value) === 'true';
}

async function roomOccupancyMap(roomIds) {
  if (!roomIds.length) return new Map();
  const agg = await HostelResident.aggregate([
    { $match: { room: { $in: roomIds }, status: 'active' } },
    { $group: { _id: '$room', count: { $sum: 1 } } }
  ]);
  return new Map(agg.map((row) => [String(row._id), Number(row.count || 0)]));
}

async function listHostels(req, res, next) {
  try {
    const { q, active } = req.query;
    const filter = {};
    if (typeof active !== 'undefined') filter.active = toBool(active);
    if (q) filter.name = { $regex: q, $options: 'i' };

    const hostels = await Hostel.find(filter).sort({ name: 1 }).lean();
    res.json({ hostels });
  } catch (err) {
    next(err);
  }
}

async function createHostel(req, res, next) {
  try {
    const hostel = await Hostel.create({ ...req.body, createdBy: req.user.id, updatedBy: req.user.id });
    res.status(201).json({ hostel });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Hostel with this name already exists' });
    next(err);
  }
}

async function updateHostel(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid hostel id' });

    const hostel = await Hostel.findByIdAndUpdate(id, { ...req.body, updatedBy: req.user.id }, { new: true, runValidators: true });
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

    res.json({ hostel });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Hostel with this name already exists' });
    next(err);
  }
}

async function deleteHostel(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid hostel id' });

    const roomCount = await HostelRoom.countDocuments({ hostel: id });
    if (roomCount > 0) return res.status(400).json({ error: 'Delete rooms first' });

    await Hostel.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listRooms(req, res, next) {
  try {
    const { hostelId, active } = req.query;
    const filter = {};
    if (hostelId) filter.hostel = hostelId;
    if (typeof active !== 'undefined') filter.active = toBool(active);

    const rooms = await HostelRoom.find(filter)
      .sort({ createdAt: -1 })
      .populate('hostel', 'name')
      .lean();

    const map = await roomOccupancyMap(rooms.map((r) => r._id));
    const decorated = rooms.map((room) => ({
      ...room,
      occupied: map.get(String(room._id)) || 0,
      available: Math.max(0, Number(room.capacity || 0) - (map.get(String(room._id)) || 0))
    }));

    res.json({ rooms: decorated });
  } catch (err) {
    next(err);
  }
}

async function createRoom(req, res, next) {
  try {
    const { hostelId, roomNumber, capacity, floor, active } = req.body;
    const hostel = await Hostel.findById(hostelId).select('_id');
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

    const room = await HostelRoom.create({
      hostel: hostelId,
      roomNumber,
      capacity,
      floor,
      active,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    const populated = await HostelRoom.findById(room._id).populate('hostel', 'name');
    res.status(201).json({ room: populated });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Room number already exists in this hostel' });
    next(err);
  }
}

async function updateRoom(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid room id' });

    if (req.body.capacity) {
      const activeCount = await HostelResident.countDocuments({ room: id, status: 'active' });
      if (Number(req.body.capacity) < activeCount) {
        return res.status(400).json({ error: 'Capacity cannot be less than current occupancy' });
      }
    }

    const payload = { ...req.body, updatedBy: req.user.id };
    if (payload.hostelId) {
      payload.hostel = payload.hostelId;
      delete payload.hostelId;
    }

    const room = await HostelRoom.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).populate('hostel', 'name');
    if (!room) return res.status(404).json({ error: 'Room not found' });

    res.json({ room });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Room number already exists in this hostel' });
    next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid room id' });

    const activeResidents = await HostelResident.countDocuments({ room: id, status: 'active' });
    if (activeResidents > 0) return res.status(400).json({ error: 'Room has active residents' });

    await HostelRoom.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listResidents(req, res, next) {
  try {
    const { hostelId, roomId, status } = req.query;
    const filter = {};
    if (hostelId) filter.hostel = hostelId;
    if (roomId) filter.room = roomId;
    if (status) filter.status = status;

    const residents = await HostelResident.find(filter)
      .sort({ createdAt: -1 })
      .populate('student', 'name studentId class section')
      .populate('hostel', 'name')
      .populate('room', 'roomNumber capacity')
      .lean();

    res.json({ residents });
  } catch (err) {
    next(err);
  }
}

async function getResident(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid resident id' });

    const resident = await HostelResident.findById(id)
      .populate({ path: 'student', populate: [{ path: 'user', select: 'name username email role' }] })
      .populate('hostel', 'name gender wardenName address active')
      .populate('room', 'roomNumber capacity floor active')
      .lean();

    if (!resident) return res.status(404).json({ error: 'Resident not found' });

    const fees = await HostelFee.find({ resident: id }).sort({ year: -1, month: -1, createdAt: -1 }).lean();
    const summary = fees.reduce(
      (acc, row) => {
        acc.total += Number(row.amount || 0);
        acc.paid += Number(row.paidAmount || 0);
        acc.pending += Math.max(0, Number(row.amount || 0) - Number(row.paidAmount || 0));
        return acc;
      },
      { total: 0, paid: 0, pending: 0 }
    );

    res.json({ resident, fees, summary });
  } catch (err) {
    next(err);
  }
}

async function createResident(req, res, next) {
  try {
    const { studentId, hostelId, roomId, joinDate, notes } = req.body;

    const [student, hostel, room] = await Promise.all([
      Student.findById(studentId).select('_id'),
      Hostel.findById(hostelId).select('_id'),
      HostelRoom.findById(roomId).select('_id hostel capacity')
    ]);

    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (String(room.hostel) !== String(hostelId)) return res.status(400).json({ error: 'Room does not belong to selected hostel' });

    const existing = await HostelResident.findOne({ student: studentId, status: 'active' }).select('_id');
    if (existing) return res.status(400).json({ error: 'Student already has an active hostel allocation' });

    const occupancy = await HostelResident.countDocuments({ room: roomId, status: 'active' });
    if (occupancy >= Number(room.capacity || 0)) return res.status(400).json({ error: 'Room is already full' });

    const resident = await HostelResident.create({
      student: studentId,
      hostel: hostelId,
      room: roomId,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      notes,
      status: 'active',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    const populated = await HostelResident.findById(resident._id)
      .populate('student', 'name studentId class section')
      .populate('hostel', 'name')
      .populate('room', 'roomNumber capacity');

    res.status(201).json({ resident: populated });
  } catch (err) {
    next(err);
  }
}

async function updateResident(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid resident id' });

    const resident = await HostelResident.findById(id);
    if (!resident) return res.status(404).json({ error: 'Resident not found' });

    const payload = { ...req.body, updatedBy: req.user.id };
    if (payload.hostelId) {
      payload.hostel = payload.hostelId;
      delete payload.hostelId;
    }
    if (payload.roomId) {
      const nextRoom = await HostelRoom.findById(payload.roomId).select('_id hostel capacity');
      if (!nextRoom) return res.status(404).json({ error: 'Room not found' });
      if (payload.hostel && String(nextRoom.hostel) !== String(payload.hostel)) {
        return res.status(400).json({ error: 'Room does not belong to selected hostel' });
      }
      const occupancy = await HostelResident.countDocuments({ _id: { $ne: id }, room: payload.roomId, status: 'active' });
      if (occupancy >= Number(nextRoom.capacity || 0)) return res.status(400).json({ error: 'Room is already full' });
      payload.room = payload.roomId;
      delete payload.roomId;
    }

    const updated = await HostelResident.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .populate('student', 'name studentId class section')
      .populate('hostel', 'name')
      .populate('room', 'roomNumber capacity');

    res.json({ resident: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteResident(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid resident id' });

    await HostelResident.findByIdAndDelete(id);
    await HostelFee.deleteMany({ resident: id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function listFees(req, res, next) {
  try {
    const { status, residentId, month, year } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (residentId) filter.resident = residentId;
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const fees = await HostelFee.find(filter)
      .sort({ year: -1, month: -1, createdAt: -1 })
      .populate({ path: 'resident', populate: [{ path: 'student', select: 'name studentId class section' }, { path: 'hostel', select: 'name' }, { path: 'room', select: 'roomNumber' }] })
      .lean();

    const totals = fees.reduce(
      (acc, row) => {
        acc.total += Number(row.amount || 0);
        acc.paid += Number(row.paidAmount || 0);
        acc.pending += Math.max(0, Number(row.amount || 0) - Number(row.paidAmount || 0));
        return acc;
      },
      { total: 0, paid: 0, pending: 0 }
    );

    res.json({ fees, totals });
  } catch (err) {
    next(err);
  }
}

async function createFee(req, res, next) {
  try {
    const { residentId, amount, month, year, dueDate, notes } = req.body;
    const resident = await HostelResident.findById(residentId).select('_id status');
    if (!resident) return res.status(404).json({ error: 'Resident not found' });

    const fee = await HostelFee.create({
      resident: residentId,
      amount,
      paidAmount: 0,
      month,
      year,
      dueDate: new Date(dueDate),
      status: 'pending',
      notes,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    const populated = await HostelFee.findById(fee._id)
      .populate({ path: 'resident', populate: [{ path: 'student', select: 'name studentId class section' }, { path: 'hostel', select: 'name' }, { path: 'room', select: 'roomNumber' }] });

    res.status(201).json({ fee: populated });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Fee record for this resident and month already exists' });
    next(err);
  }
}

async function payFee(req, res, next) {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid fee id' });

    const fee = await HostelFee.findById(id);
    if (!fee) return res.status(404).json({ error: 'Fee not found' });

    const amount = Number(req.body.amount || 0);
    const nextPaid = Number(fee.paidAmount || 0) + amount;
    if (nextPaid > Number(fee.amount || 0)) {
      return res.status(400).json({ error: 'Payment exceeds due amount' });
    }

    fee.paidAmount = nextPaid;
    fee.paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date();
    if (nextPaid === Number(fee.amount || 0)) fee.status = 'paid';
    else if (nextPaid > 0) fee.status = 'partial';
    await fee.save();

    const populated = await HostelFee.findById(id)
      .populate({ path: 'resident', populate: [{ path: 'student', select: 'name studentId class section' }, { path: 'hostel', select: 'name' }, { path: 'room', select: 'roomNumber' }] });

    res.json({ fee: populated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listHostels,
  createHostel,
  updateHostel,
  deleteHostel,
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  listResidents,
  getResident,
  createResident,
  updateResident,
  deleteResident,
  listFees,
  createFee,
  payFee
};
