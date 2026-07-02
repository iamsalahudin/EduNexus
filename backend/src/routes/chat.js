const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middlewares/auth');
const rateLimit = require('express-rate-limit');

// Rate limit: 2 requests per 30s per user
const chatLimiter = rateLimit({
	windowMs: 30 * 1000,
	max: 2,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : req.ip),
});

// POST /api/chat - send message to n8n agent
router.post('/', requireAuth, chatLimiter, chatController.sendMessage);

// GET /api/chat/sessions - list chat sessions for the current user
router.get('/sessions', requireAuth, chatController.listSessions);

// GET /api/chat/sessions/:sessionKey/messages - fetch messages for a session
router.get('/sessions/:sessionKey/messages', requireAuth, chatController.getSessionMessages);

// GET /api/chat/files/:fileId - download attachment
router.get('/files/:fileId', requireAuth, chatController.downloadAttachment);

module.exports = router;
