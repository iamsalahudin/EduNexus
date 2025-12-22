const { FCMToken } = require('../models');
const { registerFCMToken, revokeFCMToken } = require('../utils/fcm');

// Register FCM token
async function registerToken(req, res, next) {
  try {
    const { token, deviceInfo } = req.body;
    const userId = req.user.id;

    const fcmToken = await registerFCMToken(userId, token, deviceInfo);
    if (!fcmToken) {
      return res.status(400).json({ error: 'Failed to register token (Firebase not configured)' });
    }

    res.status(201).json({ fcmToken });
  } catch (err) {
    next(err);
  }
}

// Revoke FCM token
async function revokeToken(req, res, next) {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    await revokeFCMToken(userId, token);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// Get all active tokens for user
async function getTokens(req, res, next) {
  try {
    const userId = req.user.id;

    const tokens = await FCMToken.find({ user: userId, isActive: true });
    res.json({ tokens });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerToken, revokeToken, getTokens };
