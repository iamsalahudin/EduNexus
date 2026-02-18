const { Complaint, User, Student } = require('../models');
const mongoose = require('mongoose');

// Submit a complaint or feedback (any authenticated user)
async function submitComplaint(req, res, next) {
  try {
    const { subject, message, relatedToStudent } = req.body;
    const createdBy = req.user.id;

    const complaint = await Complaint.create({ subject, message, createdBy, relatedToStudent });
    res.status(201).json({ complaint });
  } catch (err) {
    next(err);
  }
}

// Add comment to complaint (any authenticated user)
async function addComment(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    complaint.comments.push({ author: req.user.id, text: req.body.text });
    await complaint.save();
    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

// Get complaints (Admin sees all, others see own)
async function getComplaints(req, res, next) {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    if (role !== 'Admin') {
      filter.$or = [{ createdBy: userId }, { assignedTo: userId }];
    }

    const complaints = await Complaint.find(filter).populate('createdBy assignedTo','firstName lastName email');
    res.json({ complaints });
  } catch (err) {
    next(err);
  }
}

// Get single complaint
async function getComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('createdBy assignedTo','firstName lastName email');
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    // access control: non-admin only allowed if owner or assigned
    if (req.user.role !== 'Admin') {
      const uid = req.user.id.toString();
      if (complaint.createdBy._id.toString() !== uid && !(complaint.assignedTo && complaint.assignedTo._id.toString() === uid)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

// Assign complaint to a user (Admin)
async function assignComplaint(req, res, next) {
  try {
    const { userId } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    complaint.assignedTo = userId;
    complaint.status = 'in_progress';
    await complaint.save();
    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

// Change status (assigned user or Admin)
async function changeStatus(req, res, next) {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    const uid = req.user.id.toString();
    if (req.user.role !== 'Admin' && !(complaint.assignedTo && complaint.assignedTo.toString() === uid)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    complaint.status = status;
    if (status === 'resolved') complaint.resolvedAt = new Date();
    await complaint.save();
    res.json({ complaint });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitComplaint, addComment, getComplaints, getComplaint, assignComplaint, changeStatus };