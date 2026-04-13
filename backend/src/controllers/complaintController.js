const { Complaint, User, Student } = require('../models');
const mongoose = require('mongoose');

const MANAGER_ROLES = new Set(['Admin', 'Principal']);
const ASSIGNEE_ROLES = new Set(['Teacher', 'HR', 'Reception', 'Finance', 'Warden']);

function isManager(user) {
  return MANAGER_ROLES.has(String(user?.role || ''));
}

function isAssignedResponder(user) {
  return ASSIGNEE_ROLES.has(String(user?.role || ''));
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSortOrder(value) {
  return String(value || '').toLowerCase() === 'asc' ? 1 : -1;
}

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function canAccessComplaint(user, complaintDoc) {
  if (!user || !complaintDoc) return false;
  if (isManager(user)) return true;

  const uid = String(user.id || user._id || '');
  const creatorId = String(complaintDoc?.createdBy?._id || complaintDoc?.createdBy || '');
  const assigneeId = String(complaintDoc?.assignedTo?._id || complaintDoc?.assignedTo || '');
  return uid === creatorId || uid === assigneeId;
}

function canCommentOnComplaint(user, complaintDoc) {
  if (!user || !complaintDoc) return false;
  if (isManager(user)) return true;

  const uid = String(user.id || user._id || '');
  const creatorId = String(complaintDoc?.createdBy?._id || complaintDoc?.createdBy || '');
  const assigneeId = String(complaintDoc?.assignedTo?._id || complaintDoc?.assignedTo || '');

  if (uid === creatorId) return true;
  if (uid === assigneeId) return true;
  return false;
}

function canSetStatus(user, complaintDoc, status) {
  if (isManager(user)) return true;

  const uid = String(user?.id || user?._id || '');
  const assigneeId = String(complaintDoc?.assignedTo?._id || complaintDoc?.assignedTo || '');
  if (!uid || uid !== assigneeId) return false;

  return status === 'in_progress' || status === 'resolved';
}

function normalizeComplaintInput(body) {
  const title = String(body?.title || body?.subject || '').trim();
  const description = String(body?.description || body?.message || '').trim();
  const category = String(body?.category || body?.type || 'general').trim().toLowerCase();
  const priority = String(body?.priority || 'medium').trim().toLowerCase();
  return {
    title,
    description,
    category,
    priority,
    type: body?.type ? String(body.type).trim() : undefined,
    relatedToStudent: body?.relatedToStudent || null
  };
}

async function submitComplaint(req, res, next) {
  try {
    const { title, description, category, priority, type, relatedToStudent } = normalizeComplaintInput(req.body);
    const createdBy = req.user.id;

    let studentRef = null;
    if (relatedToStudent) {
      if (!mongoose.Types.ObjectId.isValid(relatedToStudent)) {
        return res.status(400).json({ error: 'Invalid relatedToStudent id' });
      }
      const student = await Student.findById(relatedToStudent).select('_id').lean();
      if (!student) return res.status(404).json({ error: 'Related student not found' });
      studentRef = student._id;
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      type,
      status: 'open',
      createdBy,
      relatedToStudent: studentRef
    });

    const populated = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name username email role')
      .populate('assignedTo', 'name username email role')
      .populate('relatedToStudent', 'studentId class section')
      .lean();

    res.status(201).json({ complaint: populated });
  } catch (err) {
    next(err);
  }
}

// Add comment to complaint (creator/assignee/manager)
async function addComment(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    if (!canCommentOnComplaint(req.user, complaint)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const message = String(req.body?.message || req.body?.text || '').trim();
    if (!message) return res.status(400).json({ error: 'Comment message is required' });

    complaint.comments.push({ author: req.user.id, message });
    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name username email role')
      .populate('assignedTo', 'name username email role')
      .populate('relatedToStudent', 'studentId class section')
      .populate('comments.author', 'name username email role')
      .lean();

    res.json({ complaint: populated });
  } catch (err) {
    next(err);
  }
}

// Get complaints with role filters and pagination
async function getComplaints(req, res, next) {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const { status, category, q, page, limit, sortOrder } = req.query;

    const pageNo = parsePositiveInt(page, 1);
    const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
    const skip = (pageNo - 1) * pageSize;

    const filter = {};
    if (status) filter.status = normalizeStatus(status);
    if (category) filter.category = String(category).trim().toLowerCase();

    const search = String(q || '').trim();
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: re },
        { description: re }
      ];
    }

    if (isManager(req.user)) {
      // Managers can see all complaints.
    } else if (role === 'Student' || role === 'Parent') {
      filter.createdBy = userId;
    } else if (isAssignedResponder(req.user) || role === 'Teacher') {
      const scoped = [{ createdBy: userId }, { assignedTo: userId }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: scoped }];
        delete filter.$or;
      } else {
        filter.$or = scoped;
      }
    } else {
      filter.createdBy = userId;
    }

    const [rows, total] = await Promise.all([
      Complaint.find(filter)
        .populate('createdBy', 'name username email role')
        .populate('assignedTo', 'name username email role')
        .populate('relatedToStudent', 'studentId class section')
        .sort({ createdAt: normalizeSortOrder(sortOrder), _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Complaint.countDocuments(filter)
    ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    res.json({
      complaints: rows,
      pagination: {
        page: pageNo,
        limit: pageSize,
        total,
        totalPages,
        hasPrev: pageNo > 1,
        hasNext: pageNo < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

// Get single complaint
async function getComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'name username email role')
      .populate('assignedTo', 'name username email role')
      .populate('relatedToStudent', 'studentId class section')
      .populate('comments.author', 'name username email role');
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    if (!canAccessComplaint(req.user, complaint)) {
      return res.status(403).json({ error: 'Forbidden' });
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

    const assignee = await User.findById(userId).select('_id role').lean();
    if (!assignee) return res.status(404).json({ error: 'Assignee user not found' });

    if (!ASSIGNEE_ROLES.has(String(assignee.role || ''))) {
      return res.status(400).json({ error: 'Assignee role is not allowed for complaint assignment' });
    }

    complaint.assignedTo = assignee._id;
    complaint.status = 'assigned';
    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name username email role')
      .populate('assignedTo', 'name username email role')
      .populate('relatedToStudent', 'studentId class section')
      .populate('comments.author', 'name username email role')
      .lean();

    res.json({ complaint: populated });
  } catch (err) {
    next(err);
  }
}

// Change status (manager or assigned responder)
async function changeStatus(req, res, next) {
  try {
    const status = normalizeStatus(req.body?.status);
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    if (!canSetStatus(req.user, complaint, status)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (status === 'assigned' && !complaint.assignedTo) {
      return res.status(400).json({ error: 'Cannot set assigned without assignedTo user' });
    }

    if (status === 'closed' && !isManager(req.user)) {
      return res.status(403).json({ error: 'Only Admin/Principal can close complaints' });
    }

    complaint.status = status;
    if (status === 'resolved') complaint.resolvedAt = new Date();
    if (status !== 'resolved') complaint.resolvedAt = undefined;
    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('createdBy', 'name username email role')
      .populate('assignedTo', 'name username email role')
      .populate('relatedToStudent', 'studentId class section')
      .populate('comments.author', 'name username email role')
      .lean();

    res.json({ complaint: populated });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitComplaint, addComment, getComplaints, getComplaint, assignComplaint, changeStatus };