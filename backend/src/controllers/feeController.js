const { Fee, Student, User } = require('../models');
const mongoose = require('mongoose');

// Create a fee entry for a student (Admin/Finance)
async function createFee(req, res, next) {
  try {
    const { studentId, amount, dueDate, notes } = req.body;
    if (!studentId || !amount) return res.status(400).json({ error: 'Missing required fields' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const fee = await Fee.create({ student: studentId, amount, dueDate: dueDate ? new Date(dueDate) : undefined, notes });
    res.status(201).json({ fee });
  } catch (err) {
    next(err);
  }
}

// Get fees (role-based)
async function getFees(req, res, next) {
  try {
    const { studentId, status } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    const filter = {};
    if (status) filter.status = status;
    if (studentId) filter.student = new mongoose.Types.ObjectId(studentId);

    if (userRole === 'Student') {
      filter.student = userId;
    } else if (userRole === 'Parent') {
      // find children
      const children = await Student.find({ parents: userId });
      const ids = children.map((c) => c._id);
      filter.student = { $in: ids };
    }

    const fees = await Fee.find(filter).populate('student', 'firstName lastName studentId class');
    res.json({ fees });
  } catch (err) {
    next(err);
  }
}

// Record a payment (Parent/Reception/Admin/Finance)
async function recordPayment(req, res, next) {
  try {
    const { amount, method, transactionId } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ error: 'Fee not found' });

    const payment = { amount, method, transactionId, paidAt: new Date() };
    fee.payments.push(payment);

    // update status
    const paidSum = fee.payments.reduce((s, p) => s + (p.amount || 0), 0);
    if (paidSum >= fee.amount) fee.status = 'paid';
    else if (paidSum > 0) fee.status = 'pending';

    await fee.save();
    res.json({ fee });
  } catch (err) {
    next(err);
  }
}

// Update fee (Admin/Finance)
async function updateFee(req, res, next) {
  try {
    const updates = req.body;
    const fee = await Fee.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!fee) return res.status(404).json({ error: 'Not found' });
    res.json({ fee });
  } catch (err) {
    next(err);
  }
}

// Delete fee (Admin)
async function deleteFee(req, res, next) {
  try {
    await Fee.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createFee, getFees, recordPayment, updateFee, deleteFee };