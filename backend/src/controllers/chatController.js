const logger = require('../utils/logger');
const { addChatJob, isQueueReady, waitForQueueReady } = require('../queues/chatQueue');
const { processChat } = require('../services/chatJob');
const cache = require('../utils/cache');
const redisCache = require('../utils/redisCache');
const { ChatSession, ChatMessage, ChatFile } = require('../models');

const MAX_ATTACHMENT_BYTES = parseInt(process.env.CHAT_ATTACHMENT_MAX_BYTES || '5242880', 10);

async function persistAttachments(rawAttachments, session, userId) {
  if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) return [];

  const normalized = [];

  for (const att of rawAttachments) {
    // If attachment already has a URL and no embedded content, keep as-is
    if (att?.url && !att?.content && !att?.data && !att?.base64) {
      normalized.push(att);
      continue;
    }

    const base64 = att?.content || att?.data || att?.base64;
    if (!base64) continue;

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      throw new Error('Attachment exceeds maximum allowed size');
    }

    const fileDoc = await ChatFile.create({
      session: session._id,
      owner: userId,
      filename: att.name || 'file',
      mimeType: att.mimeType || 'application/octet-stream',
      size: buffer.length,
      data: buffer,
      meta: att.meta,
    });

    normalized.push({
      name: fileDoc.filename,
      url: `/api/chat/files/${fileDoc._id}`,
      mimeType: fileDoc.mimeType,
      size: fileDoc.size,
      kind: att.kind,
      meta: att.meta,
    });
  }

  return normalized;
}

async function ensureSession({ userId, sessionId, role }) {
  const sessionKey = sessionId || userId.toString();
  const now = new Date();

  const session = await ChatSession.findOneAndUpdate(
    { user: userId, sessionKey },
    {
      $setOnInsert: {
        sessionKey,
        roleAtCreation: role,
        status: 'open',
      },
      $set: { lastMessageAt: now },
    },
    { new: true, upsert: true }
  );

  return session;
}

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

    const session = await ensureSession({ userId: user.id, sessionId, role: user.role });

    // Build payload for n8n with user credentials & context
    const n8nPayload = {
      sessionId: session.sessionKey,
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Persist user message
    await ChatMessage.create({
      session: session._id,
      senderType: 'user',
      senderUser: user.id,
      text: message.trim(),
    });

    // Response cache (per user + normalized message)
    const cacheTtl = parseInt(process.env.CHAT_CACHE_TTL_MS || '120000', 10);
    const cacheKey = `${user.id}:${message.trim().toLowerCase()}`;
    if (cacheTtl > 0) {
      // Try Redis first, then memory fallback
      const cachedRedis = await redisCache.get(cacheKey);
      if (cachedRedis) {
        logger.info('[CHAT] cache hit (redis)');
        const attachments = await persistAttachments(cachedRedis.attachments || [], session, user.id);
        const cachedResponse = { ...cachedRedis, attachments };
        await ChatMessage.create({
          session: session._id,
          senderType: 'agent',
          text: cachedResponse.reply,
          data: cachedResponse.data || null,
          actions: cachedResponse.actions || [],
          sources: cachedResponse.sources || [],
          attachments: cachedResponse.attachments || [],
        });
        await ChatSession.updateOne(
          { _id: session._id },
          {
            lastMessageAt: new Date(),
            lastMessagePreview: cachedResponse.reply ? cachedResponse.reply.substring(0, 240) : undefined,
          }
        );
        return res.json(cachedResponse);
      }
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.info('[CHAT] cache hit (memory)');
        const attachments = await persistAttachments(cached.attachments || [], session, user.id);
        const cachedResponse = { ...cached, attachments };
        await ChatMessage.create({
          session: session._id,
          senderType: 'agent',
          text: cachedResponse.reply,
          data: cachedResponse.data || null,
          actions: cachedResponse.actions || [],
          sources: cachedResponse.sources || [],
          attachments: cachedResponse.attachments || [],
        });
        await ChatSession.updateOne(
          { _id: session._id },
          {
            lastMessageAt: new Date(),
            lastMessagePreview: cachedResponse.reply ? cachedResponse.reply.substring(0, 240) : undefined,
          }
        );
        return res.json(cachedResponse);
      }
    }

    // Ensure queue is ready; if not, fallback to direct processing
    const ready = await waitForQueueReady();
    if (!ready || !isQueueReady()) {
      logger.warn('[CHAT] Queue not ready, falling back to direct processing');
      const directResult = await processChat(n8nPayload);
      const attachments = await persistAttachments(directResult.attachments || [], session, user.id);
      const responsePayload = { ...directResult, attachments };
      await ChatMessage.create({
        session: session._id,
        senderType: 'agent',
        text: responsePayload.reply,
        data: responsePayload.data || null,
        actions: responsePayload.actions || [],
        sources: responsePayload.sources || [],
        attachments: responsePayload.attachments || [],
      });
      await ChatSession.updateOne(
        { _id: session._id },
        {
          lastMessageAt: new Date(),
          lastMessagePreview: responsePayload.reply ? responsePayload.reply.substring(0, 240) : undefined,
        }
      );
      if (cacheTtl > 0) {
        await redisCache.set(cacheKey, responsePayload, cacheTtl);
        cache.set(cacheKey, responsePayload, cacheTtl);
      }
      return res.json(responsePayload);
    }

    // Enqueue chat job (Bull) and wait for completion
    logger.info(`[CHAT] Enqueue job for User ${user.id} (${user.role})`);
    let job;
    try {
      job = await addChatJob(n8nPayload);
    } catch (queueErr) {
      logger.error('[CHAT] Queue enqueue failed, falling back to direct processing:', queueErr.message);
      const directResult = await processChat(n8nPayload);
      const attachments = await persistAttachments(directResult.attachments || [], session, user.id);
      const responsePayload = { ...directResult, attachments };
      await ChatMessage.create({
        session: session._id,
        senderType: 'agent',
        text: responsePayload.reply,
        data: responsePayload.data || null,
        actions: responsePayload.actions || [],
        sources: responsePayload.sources || [],
        attachments: responsePayload.attachments || [],
      });
      await ChatSession.updateOne(
        { _id: session._id },
        {
          lastMessageAt: new Date(),
          lastMessagePreview: responsePayload.reply ? responsePayload.reply.substring(0, 240) : undefined,
        }
      );
      if (cacheTtl > 0) {
        await redisCache.set(cacheKey, responsePayload, cacheTtl);
        cache.set(cacheKey, responsePayload, cacheTtl);
      }
      return res.json(responsePayload);
    }

    // Wait for job result with timeout guard
    const jobTimeout = parseInt(process.env.CHAT_JOB_TIMEOUT_MS || '35000', 10) + 5000;
    const result = await Promise.race([
      job.finished(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Chat job timed out')), jobTimeout)),
    ]);

    const attachments = await persistAttachments(result.attachments || [], session, user.id);
    const responsePayload = { ...result, attachments };

    if (cacheTtl > 0) {
      await redisCache.set(cacheKey, responsePayload, cacheTtl);
      cache.set(cacheKey, responsePayload, cacheTtl);
    }
    // Persist agent response
    await ChatMessage.create({
      session: session._id,
      senderType: 'agent',
      text: responsePayload.reply,
      data: responsePayload.data || null,
      actions: responsePayload.actions || [],
      sources: responsePayload.sources || [],
      attachments: responsePayload.attachments || [],
    });

    await ChatSession.updateOne(
      { _id: session._id },
      {
        lastMessageAt: new Date(),
        lastMessagePreview: responsePayload.reply ? responsePayload.reply.substring(0, 240) : undefined,
      }
    );

    res.json(responsePayload);

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

// List chat sessions for the authenticated user
exports.listSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .select('sessionKey title status lastMessageAt lastMessagePreview createdAt');

    res.json(sessions);
  } catch (err) {
    logger.error('[CHAT][LIST] failed', err.message);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
};

// Fetch messages for a specific session owned by the authenticated user
exports.getSessionMessages = async (req, res) => {
  try {
    const { sessionKey } = req.params;
    const session = await ChatSession.findOne({ sessionKey, user: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const messages = await ChatMessage.find({ session: session._id })
      .sort({ createdAt: 1 })
      .select('-__v');

    res.json({ session: {
      sessionKey: session.sessionKey,
      status: session.status,
      lastMessageAt: session.lastMessageAt,
    }, messages });
  } catch (err) {
    logger.error('[CHAT][MESSAGES] failed', err.message);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

// Download a chat attachment (stored in DB) ensuring ownership
exports.downloadAttachment = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await ChatFile.findById(fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const session = await ChatSession.findById(file.session);
    if (!session || session.user.toString() !== req.user.id) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.size);
    return res.send(file.data);
  } catch (err) {
    logger.error('[CHAT][FILE][DOWNLOAD] failed', err.message);
    return res.status(500).json({ error: 'Unable to download file' });
  }
};
