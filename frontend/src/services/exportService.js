/**
 * Export Service
 * Handles async export job submission and progress tracking
 */

import api from './api';

const exportService = {
  /**
   * Submit report card export job
   * Returns job ID for tracking progress
   */
  async submitReportCardExport(payload) {
    const response = await api.post('/exports/report-cards', {
      format: payload.format || 'pdf', // 'pdf' or 'zip'
      studentIds: payload.studentIds ? payload.studentIds.join(',') : undefined,
      term: payload.term,
      year: payload.year
    });
    return response.data;
  },

  /**
   * Get export job status and progress
   */
  async getExportStatus(jobId) {
    const response = await api.get(`/exports/${jobId}`);
    return response.data;
  },

  /**
   * Poll export status until complete
   * Returns result when done, throws if failed
   */
  async pollExportStatus(jobId, maxWaitMs = 300000) {
    const startTime = Date.now();
    const pollIntervalMs = 2000; // Poll every 2 seconds

    return new Promise((resolve, reject) => {
      const pollStatus = async () => {
        if (Date.now() - startTime > maxWaitMs) {
          reject(new Error('Export job timeout'));
          return;
        }

        try {
          const status = await this.getExportStatus(jobId);

          if (status.state === 'completed') {
            resolve(status.result);
          } else if (status.state === 'failed') {
            reject(new Error(`Export failed: ${status.error}`));
          } else {
            // Still processing, poll again
            setTimeout(pollStatus, pollIntervalMs);
          }
        } catch (error) {
          reject(error);
        }
      };

      pollStatus();
    });
  },

  /**
   * Submit and wait for export (convenience method)
   */
  async submitAndWait(payload, maxWaitMs = 300000) {
    const job = await this.submitReportCardExport(payload);
    return this.pollExportStatus(job.jobId, maxWaitMs);
  },

  /**
   * Download export file
   */
  async downloadExport(filename) {
    return api.get(`/exports/download/${filename}`, {
      responseType: 'blob'
    });
  },

  /**
   * Download export file by job ID (convenience)
   */
  async downloadByJobId(jobId) {
    const status = await this.getExportStatus(jobId);
    if (status.state !== 'completed') {
      throw new Error('Export job not completed');
    }
    if (!status.result || !status.result.filename) {
      throw new Error('No download URL available');
    }
    return this.downloadExport(status.result.filename);
  },

  /**
   * List recent export jobs
   */
  async listExports(state = 'completed', limit = 10) {
    const response = await api.get('/exports', {
      params: { state, limit }
    });
    return response.data;
  },

  /**
   * Cancel export job
   */
  async cancelExport(jobId) {
    const response = await api.delete(`/exports/${jobId}`);
    return response.data;
  }
};

export default exportService;
