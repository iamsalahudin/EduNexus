const Queue = require('bull');
const { processChat } = require('../services/chatJob');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const CONCURRENCY = parseInt(process.env.CHAT_QUEUE_CONCURRENCY || '2', 10);
const JOB_TIMEOUT = parseInt(process.env.CHAT_JOB_TIMEOUT_MS || '35000', 10);
const DISABLE_QUEUE = process.env.CHAT_QUEUE_DISABLED === 'true' || process.env.NODE_ENV === 'test';

let queueReady = false;
let initPromise;

const chatQueue = DISABLE_QUEUE
  ? {
      async add(data) {
        return { id: `test-${Date.now()}`, data };
      },
      process() {},
      on() {},
      async isReady() {
        return true;
      },
      async close() {
        return true;
      },
    }
  : new Queue('chat-queue', REDIS_URL, {
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 50,
        timeout: JOB_TIMEOUT,
      },
    });

if (!DISABLE_QUEUE) {
  chatQueue.process(CONCURRENCY, async (job) => {
    try {
      return await processChat(job.data.payload);
    } catch (err) {
      logger.error('[CHAT][QUEUE] Job failed', err.message);
      throw err;
    }
  });

  chatQueue.on('failed', (job, err) => {
    logger.error(`[CHAT][QUEUE] Job ${job.id} failed: ${err.message}`);
  });

  chatQueue.on('stalled', (job) => {
    logger.warn(`[CHAT][QUEUE] Job ${job.id} stalled`);
  });

  chatQueue.on('ready', () => {
    queueReady = true;
    logger.info('[CHAT][QUEUE] Ready');
  });

  chatQueue.on('error', (err) => {
    queueReady = false;
    logger.error('[CHAT][QUEUE] Redis/Queue error:', err.message);
  });
}

// Kick off readiness check immediately (Bull v4 uses isReady)
initPromise = chatQueue
  .isReady()
  .then(() => {
    queueReady = true;
    logger.info('[CHAT][QUEUE] isReady resolved');
  })
  .catch((err) => {
    queueReady = false;
    logger.error('[CHAT][QUEUE] isReady failed:', err.message);
  });

async function waitForQueueReady() {
  if (queueReady) return true;
  try {
    await initPromise;
    return queueReady;
  } catch (err) {
    logger.error('[CHAT][QUEUE] waitForQueueReady error:', err.message);
    return false;
  }
}

async function addChatJob(payload) {
  return chatQueue.add({ payload });
}

module.exports = {
  chatQueue,
  addChatJob,
  waitForQueueReady,
  isQueueReady: () => queueReady,
};
