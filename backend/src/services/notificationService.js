const mongoose = require('mongoose');
const { Notification } = require('../models');

function toObjectId(value) {
  try {
    return new mongoose.Types.ObjectId(value);
  } catch {
    return null;
  }
}

async function createWelcomeNotification({ userId, recipientName, role, createdBy }) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) throw new Error('Invalid userId for welcome notification');

  const creatorObjectId = toObjectId(createdBy) || userObjectId;
  const safeName = String(recipientName || 'there').trim() || 'there';
  const safeRole = String(role || 'User').trim() || 'User';

  return Notification.create({
    kind: 'broadcast',
    scope: 'targeted',
    category: 'system',
    title: 'Welcome to EduNexus',
    body: `Welcome ${safeName}! Your ${safeRole} account is ready. Explore your dashboard and start using the platform.`,
    createdBy: creatorObjectId,
    targetUsers: [userObjectId]
  });
}

async function createWelcomeNotificationSafe(payload) {
  try {
    await createWelcomeNotification(payload);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  createWelcomeNotification,
  createWelcomeNotificationSafe
};
