const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { requireAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { sendMessageSchema } = require('../validators/messaging');

// Send a message
router.post('/', requireAuth, validate(sendMessageSchema), messagingController.sendMessage);

// Get all conversations
router.get('/conversations', requireAuth, messagingController.getConversations);

// Get conversation with specific user
router.get('/conversation/:conversationWith', requireAuth, messagingController.getConversation);

// Mark message as read
router.patch('/:messageId/read', requireAuth, messagingController.markAsRead);

// Get delivery status
router.get('/:messageId/status', requireAuth, messagingController.getDeliveryStatus);

// Get unread count
router.get('/count/unread', requireAuth, messagingController.getUnreadCount);

// Delete message
router.delete('/:messageId', requireAuth, messagingController.deleteMessage);

module.exports = router;
