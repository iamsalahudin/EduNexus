const express = require('express');
const router = express.Router();
const fcmController = require('../controllers/fcmController');
const { requireAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { registerTokenSchema } = require('../validators/fcm');

// Register FCM token
router.post('/token', requireAuth, validate(registerTokenSchema), fcmController.registerToken);

// Revoke FCM token
router.post('/token/revoke', requireAuth, validate(registerTokenSchema), fcmController.revokeToken);

// Get all active tokens
router.get('/tokens', requireAuth, fcmController.getTokens);

module.exports = router;
