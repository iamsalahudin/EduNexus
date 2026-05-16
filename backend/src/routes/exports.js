/**
 * Export Routes
 * Handles async export job submission and status tracking
 */

const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth');
const {
  submitReportCardExport,
  getExportStatus,
  downloadExport,
  listExports,
  cancelExport
} = require('../controllers/exportController');

const router = express.Router();

/**
 * POST /api/exports/report-cards
 * Submit report card export job (PDF or ZIP)
 */
router.post('/report-cards', requireAuth, requireRole('Teacher', 'Admin', 'Principal'), async (req, res, next) => {
  submitReportCardExport(req, res, next);
});

/**
 * GET /api/exports
 * List export jobs
 */
router.get('/', requireAuth, async (req, res, next) => {
  listExports(req, res, next);
});

/**
 * GET /api/exports/:jobId
 * Get export job status and progress
 */
router.get('/:jobId', requireAuth, async (req, res, next) => {
  getExportStatus(req, res, next);
});

/**
 * GET /api/exports/download/:filename
 * Download exported file
 */
router.get('/download/:filename', async (req, res, next) => {
  downloadExport(req, res, next);
});

/**
 * DELETE /api/exports/:jobId
 * Cancel export job
 */
router.delete('/:jobId', requireAuth, async (req, res, next) => {
  cancelExport(req, res, next);
});

module.exports = router;
