/**
 * Export Job Queue Configuration
 * Handles background processing of large exports (PDF, ZIP, etc.)
 */

const Queue = require('bull');
const redis = require('redis');
const logger = require('../utils/logger');

const DISABLE_QUEUE = process.env.NODE_ENV === 'test';

const redisClient = DISABLE_QUEUE
  ? {
      on() {},
      quit() {
        return Promise.resolve();
      }
    }
  : redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

if (!DISABLE_QUEUE) {
  redisClient.on('error', (err) => logger.error('Redis error:', err));
  redisClient.on('connect', () => logger.info('Redis connected'));
}

const exportQueue = DISABLE_QUEUE
  ? {
      async add(name, data) {
        return {
          id: `export-${Date.now()}`,
          name,
          data,
          progress() {
            return 0;
          }
        };
      },
      async getJob() {
        return null;
      },
      async getJobs() {
        return [];
      },
      on() {},
      async process(name, handler) { return Promise.resolve(); },
      async close() {
        return true;
      }
    }
  : new Queue('exports', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 }, // Keep completed jobs for 1 hour
        removeOnFail: { age: 86400 } // Keep failed jobs for 24 hours
      }
    });

if (!DISABLE_QUEUE) {
  // Export queue event handlers
  exportQueue.on('completed', (job) => {
    logger.info(`Export job ${job.id} completed`);
  });

  exportQueue.on('failed', (job, err) => {
    logger.error(`Export job ${job.id} failed:`, err.message);
  });

  exportQueue.on('progress', (job, progress) => {
    logger.info(`Export job ${job.id} progress: ${progress}%`);
  });
}

module.exports = {
  exportQueue,
  redisClient
};


