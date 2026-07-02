const express = require('express');
const router = express.Router();
const reportCardController = require('../controllers/reportCardController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createReportCardSchema, getReportCardsSchema, exportReportCardsSchema, rejectReportCardSchema } = require('../validators/reportCards');

// All routes require auth
router.use(requireAuth);

// Create/update report card: teachers and management
router.post('/', requireRole('Teacher', 'Admin', 'Principal'), validate(createReportCardSchema), reportCardController.createUpdateReportCard);

// Export report cards as PDF (Admin/Principal/Teacher)
router.get('/export/pdf', requireRole('Teacher', 'Admin', 'Principal'), validate(exportReportCardsSchema), reportCardController.exportReportCardsPdf);

// Export per-student PDFs as ZIP
router.get('/export/zip', requireRole('Teacher', 'Admin', 'Principal'), validate(exportReportCardsSchema), reportCardController.exportReportCardsZip);

// Get report cards: all roles (filtered by role)
router.get('/', validate(getReportCardsSchema), reportCardController.getReportCards);

// Get single report card details: all authorized roles
router.get('/:id', reportCardController.getReportCard);

// Principal: approve report card
router.patch('/:id/approve', requireRole('Principal', 'Admin'), reportCardController.approveReportCard);

// Principal: reject report card (send back to teacher)
router.patch('/:id/reject', requireRole('Principal', 'Admin'), validate(rejectReportCardSchema), reportCardController.rejectReportCard);

// Admin/Principal: archive old published report cards
router.post('/archive/run', requireRole('Principal', 'Admin'), reportCardController.archiveOldReportCards);

module.exports = router;
