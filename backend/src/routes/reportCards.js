const express = require('express');
const router = express.Router();
const reportCardController = require('../controllers/reportCardController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createReportCardSchema, getReportCardsSchema, rejectReportCardSchema } = require('../validators/reportCards');

// All routes require auth
router.use(requireAuth);

// Create/update report card: teachers only
router.post('/', requireRole('Teacher'), validate(createReportCardSchema), reportCardController.createUpdateReportCard);

// Get report cards: all roles (filtered by role)
router.get('/', validate(getReportCardsSchema), reportCardController.getReportCards);

// Get single report card details: all authorized roles
router.get('/:id', reportCardController.getReportCard);

// Principal: approve report card
router.patch('/:id/approve', requireRole('Principal', 'Admin'), reportCardController.approveReportCard);

// Principal: reject report card (send back to teacher)
router.patch('/:id/reject', requireRole('Principal', 'Admin'), validate(rejectReportCardSchema), reportCardController.rejectReportCard);

module.exports = router;
