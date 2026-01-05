const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middlewares/auth');

// POST /api/chat - send message to n8n agent
router.post('/', requireAuth, chatController.sendMessage);

module.exports = router;
