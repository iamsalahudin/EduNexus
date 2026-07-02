/**
 * Export Controller
 * Handles async export requests and status tracking
 */

const { exportQueue } = require('../queues/exportQueue');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../../uploads/exports');

/**
 * Submit a report card export job
 * POST /api/exports/report-cards
 */
async function submitReportCardExport(req, res, next) {
  try {
    const { format = 'pdf', studentIds, term, year } = req.body;

    if (!['pdf', 'zip'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Must be pdf or zip.' });
    }

    // Submit job to queue
    const job = await exportQueue.add(
      'report-cards',
      {
        format,
        studentIds: studentIds ? studentIds.split(',').map((id) => id.trim()) : [],
        term,
        year,
        userId: req.user.id,
        requestedAt: new Date().toISOString()
      },
      { jobId: `export-rc-${Date.now()}-${Math.random().toString(36).slice(2)}` }
    );

    res.status(202).json({
      jobId: job.id,
      status: 'queued',
      message: `Export job submitted. Check status with: GET /api/exports/${job.id}`,
      format,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to submit export job:', error);
    res.status(500).json({ error: error.message || 'Failed to submit export job' });
  }
}

/**
 * Get export job status
 * GET /api/exports/:jobId
 */
async function getExportStatus(req, res, next) {
  try {
    const { jobId } = req.params;

    const job = await exportQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress();
    const data = job.data;
    const result = job.returnvalue;

    const response = {
      jobId: job.id,
      state,
      progress: typeof progress === 'number' ? progress : 0,
      format: data.format,
      createdAt: new Date(job.timestamp).toISOString(),
      startedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null
    };

    if (state === 'completed' && result) {
      response.result = {
        filename: result.filename,
        downloadUrl: `/api/exports/download/${result.filename}`,
        message: result.message,
        count: result.count
      };
    }

    if (state === 'failed') {
      response.error = job.failedReason;
      response.attempts = job.attemptsMade;
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to get export status:', error);
    res.status(500).json({ error: error.message || 'Failed to get export status' });
  }
}

/**
 * Download exported file
 * GET /api/exports/download/:filename
 */
async function downloadExport(req, res, next) {
  try {
    const { filename } = req.params;

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Determine content type
    const contentType = filename.endsWith('.zip') ? 'application/zip' : 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (err) => {
      logger.error('Stream error:', err);
      res.status(500).json({ error: 'Failed to download file' });
    });
  } catch (error) {
    logger.error('Download export failed:', error);
    res.status(500).json({ error: error.message || 'Failed to download export' });
  }
}

/**
 * List recent export jobs
 * GET /api/exports
 */
async function listExports(req, res, next) {
  try {
    const { state = 'completed', limit = 10 } = req.query;

    const states = ['completed', 'active', 'delayed', 'failed', 'waiting'];
    if (!states.includes(state)) {
      return res.status(400).json({ error: `Invalid state. Must be one of: ${states.join(', ')}` });
    }

    const jobs = await exportQueue.getJobs([state], 0, limit - 1);

    const exports = jobs.map((job) => ({
      jobId: job.id,
      state: job._progress ? 'processing' : state,
      progress: job.progress(),
      format: job.data.format,
      createdAt: new Date(job.timestamp).toISOString(),
      completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      result: job.returnvalue || null
    }));

    res.status(200).json({
      state,
      total: exports.length,
      exports
    });
  } catch (error) {
    logger.error('Failed to list exports:', error);
    res.status(500).json({ error: error.message || 'Failed to list exports' });
  }
}

/**
 * Cancel an export job
 * DELETE /api/exports/:jobId
 */
async function cancelExport(req, res, next) {
  try {
    const { jobId } = req.params;

    const job = await exportQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    if (state !== 'active' && state !== 'waiting') {
      return res.status(400).json({ error: `Cannot cancel job in '${state}' state` });
    }

    await job.remove();
    res.status(200).json({ message: 'Export job cancelled' });
  } catch (error) {
    logger.error('Failed to cancel export:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel export' });
  }
}

module.exports = {
  submitReportCardExport,
  getExportStatus,
  downloadExport,
  listExports,
  cancelExport
};
