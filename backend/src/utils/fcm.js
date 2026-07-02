const admin = require('firebase-admin');
const logger = require('./logger');
const { FCMToken } = require('../models');

// Initialize Firebase Admin SDK
// You need to provide a service account JSON file via FIREBASE_CREDENTIALS_PATH env var
let firebaseInitialized = false;

function initializeFirebase() {
  try {
    const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
    if (!credentialsPath) {
      logger.warn('FIREBASE_CREDENTIALS_PATH not set. FCM features will be disabled.');
      return false;
    }

    const serviceAccount = require(credentialsPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized');
    return true;
  } catch (err) {
    logger.error('Failed to initialize Firebase:', err.message);
    return false;
  }
}

// Register FCM token for a user
async function registerFCMToken(userId, token, deviceInfo) {
  try {
    if (!firebaseInitialized) return null;

    const fcmToken = await FCMToken.findOneAndUpdate(
      { user: userId, token },
      { deviceInfo, isActive: true, lastUsedAt: new Date() },
      { upsert: true, new: true }
    );
    logger.info(`FCM token registered for user ${userId}`);
    return fcmToken;
  } catch (err) {
    logger.error('Error registering FCM token:', err);
    return null;
  }
}

// Revoke FCM token
async function revokeFCMToken(userId, token) {
  try {
    await FCMToken.findOneAndUpdate(
      { user: userId, token },
      { isActive: false }
    );
    logger.info(`FCM token revoked for user ${userId}`);
  } catch (err) {
    logger.error('Error revoking FCM token:', err);
  }
}

// Send push notification to a single user
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    if (!firebaseInitialized) return { success: false, error: 'Firebase not initialized' };

    const fcmTokens = await FCMToken.find({ user: userId, isActive: true });
    if (!fcmTokens.length) {
      logger.warn(`No active FCM tokens found for user ${userId}`);
      return { success: false, error: 'No active tokens' };
    }

    const tokens = fcmTokens.map((t) => t.token);
    const payload = {
      notification: { title, body },
      data: { ...data, timestamp: new Date().toISOString() }
    };

    const response = await admin.messaging().sendMulticast({
      tokens,
      notification: payload.notification,
      data: payload.data
    });

    // Update lastUsedAt for successful sends
    if (response.successCount > 0) {
      await FCMToken.updateMany(
        { user: userId, token: { $in: tokens.slice(0, response.successCount) } },
        { lastUsedAt: new Date() }
      );
    }

    // Disable failed tokens
    if (response.failureCount > 0) {
      const failedTokenIndices = response.responses
        .map((r, idx) => (r.error ? idx : null))
        .filter((idx) => idx !== null);
      const failedTokens = failedTokenIndices.map((idx) => tokens[idx]);
      await FCMToken.updateMany(
        { user: userId, token: { $in: failedTokens } },
        { isActive: false }
      );
    }

    logger.info(`Push notification sent to ${userId}: ${response.successCount} succeeded, ${response.failureCount} failed`);
    return { success: true, sent: response.successCount, failed: response.failureCount };
  } catch (err) {
    logger.error('Error sending push notification:', err);
    return { success: false, error: err.message };
  }
}

// Send notification to multiple users
async function sendBulkPushNotification(userIds, title, body, data = {}) {
  try {
    if (!firebaseInitialized) return { success: false, error: 'Firebase not initialized' };

    const results = {};
    for (const userId of userIds) {
      results[userId] = await sendPushNotification(userId, title, body, data);
    }
    return results;
  } catch (err) {
    logger.error('Error sending bulk push notification:', err);
    return { success: false, error: err.message };
  }
}

// Send notification for homework posted
async function notifyHomeworkPosted(homeworkId, teacherId, class_, subject) {
  const title = 'New Homework';
  const body = `New homework assigned in ${subject}`;
  const data = { type: 'homework:posted', homeworkId };
  
  // Get all students in the class
  const Student = require('../models').Student;
  const students = await Student.find({ class: class_ });
  const studentIds = students.map((s) => s._id.toString());

  return sendBulkPushNotification(studentIds, title, body, data);
}

// Send notification for homework deadline reminder
async function notifyHomeworkDeadline(homeworkId, title, dueDate) {
  const body = `Homework due on ${new Date(dueDate).toDateString()}`;
  const data = { type: 'homework:deadline', homeworkId };

  // Get all submissions for this homework
  const Homework = require('../models').Homework;
  const homework = await Homework.findById(homeworkId);
  const studentIds = homework.submissions.map((s) => s.student.toString());

  return sendBulkPushNotification(studentIds, title, body, data);
}

// Send notification for homework graded
async function notifyHomeworkGraded(homeworkId, studentId, marks, maxMarks) {
  const title = 'Homework Graded';
  const body = `Your homework has been graded: ${marks}/${maxMarks}`;
  const data = { type: 'homework:graded', homeworkId, marks };

  return sendPushNotification(studentId, title, body, data);
}

// Send notification for fee payment reminder
async function notifyFeePaymentDue(studentId, dueDate, amount) {
  const title = 'Fee Payment Due';
  const body = `Pay fee of $${amount} by ${new Date(dueDate).toDateString()}`;
  const data = { type: 'fee:due' };

  return sendPushNotification(studentId, title, body, data);
}

// Send notification for attendance alert
async function notifyAttendanceAlert(studentId, attendancePercent) {
  if (attendancePercent < 75) {
    const title = 'Low Attendance Alert';
    const body = `Your attendance is ${attendancePercent.toFixed(1)}%. Below 75% required.`;
    const data = { type: 'attendance:alert', percent: attendancePercent };
    return sendPushNotification(studentId, title, body, data);
  }
  return { success: false };
}

module.exports = {
  initializeFirebase,
  registerFCMToken,
  revokeFCMToken,
  sendPushNotification,
  sendBulkPushNotification,
  notifyHomeworkPosted,
  notifyHomeworkDeadline,
  notifyHomeworkGraded,
  notifyFeePaymentDue,
  notifyAttendanceAlert
};
