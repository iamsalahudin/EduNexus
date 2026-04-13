const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { submitComplaintSchema, addCommentSchema, assignComplaintSchema, changeStatusSchema } = require('../validators/complaints');

// Submit complaint (any authenticated user)
router.post('/', requireAuth, validate(submitComplaintSchema), complaintController.submitComplaint);
// List complaints (Admin sees all, others see own/assigned)
router.get('/', requireAuth, complaintController.getComplaints);
// Get single complaint
router.get('/:id', requireAuth, complaintController.getComplaint);
// Add comment
router.post('/:id/comments', requireAuth, requireRole('Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'HR', 'Reception', 'Finance', 'Warden'), validate(addCommentSchema), complaintController.addComment);
// Assign (Admin and Principal)
router.patch('/:id/assign', requireAuth, requireRole('Admin', 'Principal'), validate(assignComplaintSchema), complaintController.assignComplaint);
// Change status (assigned user or admin)
router.patch('/:id/status', requireAuth, requireRole('Admin', 'Principal', 'Teacher', 'HR', 'Reception', 'Finance', 'Warden'), validate(changeStatusSchema), complaintController.changeStatus);

module.exports = router;