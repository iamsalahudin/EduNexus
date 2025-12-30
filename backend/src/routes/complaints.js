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
router.post('/:id/comments', requireAuth, validate(addCommentSchema), complaintController.addComment);
// Assign (Admin)
router.patch('/:id/assign', requireAuth, requireRole('Admin'), validate(assignComplaintSchema), complaintController.assignComplaint);
// Change status (assigned user or admin)
router.patch('/:id/status', requireAuth, validate(changeStatusSchema), complaintController.changeStatus);

module.exports = router;