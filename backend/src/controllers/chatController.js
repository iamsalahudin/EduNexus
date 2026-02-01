const logger = require('../utils/logger');
const { addChatJob, isQueueReady, waitForQueueReady } = require('../queues/chatQueue');
const { processChat } = require('../services/chatJob');
const cache = require('../utils/cache');
const redisCache = require('../utils/redisCache');

/**
 * Send user message to n8n agent
 * n8n webhook must return: { reply: string, data?: object, actions?: array }
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const user = req.user; // From auth middleware

    // Validate input
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
    }

    // Validate user is authenticated
    if (!user || !user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Build payload for n8n with user credentials & context
    const n8nPayload = {
      sessionId: sessionId || user.id,
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Response cache (per user + normalized message)
    const cacheTtl = parseInt(process.env.CHAT_CACHE_TTL_MS || '120000', 10);
    const cacheKey = `${user.id}:${message.trim().toLowerCase()}`;
    if (cacheTtl > 0) {
      // Try Redis first, then memory fallback
      const cachedRedis = await redisCache.get(cacheKey);
      if (cachedRedis) {
        logger.info('[CHAT] cache hit (redis)');
        return res.json(cachedRedis);
      }
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.info('[CHAT] cache hit (memory)');
        return res.json(cached);
      }
    }

    // Ensure queue is ready; if not, fallback to direct processing
    const ready = await waitForQueueReady();
    if (!ready || !isQueueReady()) {
      logger.warn('[CHAT] Queue not ready, falling back to direct processing');
      const directResult = await processChat(n8nPayload);
      if (cacheTtl > 0) {
        await redisCache.set(cacheKey, directResult, cacheTtl);
        cache.set(cacheKey, directResult, cacheTtl);
      }
      return res.json(directResult);
    }

    // Enqueue chat job (Bull) and wait for completion
    logger.info(`[CHAT] Enqueue job for User ${user.id} (${user.role})`);
    let job;
    try {
      job = await addChatJob(n8nPayload);
    } catch (queueErr) {
      logger.error('[CHAT] Queue enqueue failed, falling back to direct processing:', queueErr.message);
      const directResult = await processChat(n8nPayload);
      if (cacheTtl > 0) {
        await redisCache.set(cacheKey, directResult, cacheTtl);
        cache.set(cacheKey, directResult, cacheTtl);
      }
      return res.json(directResult);
    }

    // Wait for job result with timeout guard
    const jobTimeout = parseInt(process.env.CHAT_JOB_TIMEOUT_MS || '35000', 10) + 5000;
    const result = await Promise.race([
      job.finished(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Chat job timed out')), jobTimeout)),
    ]);

    if (cacheTtl > 0) {
      await redisCache.set(cacheKey, result, cacheTtl);
      cache.set(cacheKey, result, cacheTtl);
    }
    res.json(result);

  } catch (error) {
    logger.error('[CHAT ERROR]', error.message);
    
    // Log full error details for debugging
    if (error.response) {
      logger.error('[CHAT ERROR] n8n Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }

    // If agent/queue failed but we have a cached answer, serve it as a stale response
    const cacheTtl = parseInt(process.env.CHAT_CACHE_TTL_MS || '120000', 10);
    if (cacheTtl > 0) {
      const cacheKey = `${req.user?.id || 'anon'}:${(req.body?.message || '').trim().toLowerCase()}`;
      const cachedRedis = await redisCache.get(cacheKey);
      if (cachedRedis) {
        logger.warn('[CHAT] Serving stale cached response after failure (redis)');
        return res.json(cachedRedis);
      }
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.warn('[CHAT] Serving stale cached response after failure (memory)');
        return res.json(cached);
      }
    }

    res.status(500).json({ error: 'Failed to process your query' });
  }
};
