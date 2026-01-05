const socketIO = require('socket.io');
const { verifyAccessToken } = require('./jwt');
const logger = require('./logger');

// Store active user connections
const activeUsers = new Map(); // userId -> Set of socket IDs

function setupSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Middleware for JWT verification
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected: ${socket.id}`);
    
    // Track active users
    if (!activeUsers.has(socket.userId)) {
      activeUsers.set(socket.userId, new Set());
    }
    activeUsers.get(socket.userId).add(socket.id);

    // Join user-specific room for private messages
    socket.join(`user:${socket.userId}`);

    // Emit online status to interested parties
    io.emit('user:online', { userId: socket.userId, status: 'online' });

    // Handle incoming messages
    socket.on('message:send', async (data) => {
      try {
        const { recipientId, text, attachments } = data;
        const Message = require('../models').Message;
        const MessageDelivery = require('../models').MessageDelivery;

        // Save message to database
        const message = await Message.create({
          sender: socket.userId,
          recipient: recipientId,
          text,
          attachments: attachments || []
        });

        // Create delivery record
        const delivery = await MessageDelivery.create({
          message: message._id,
          recipient: recipientId,
          status: 'sent'
        });

        // Emit to recipient if online
        const recipientSockets = activeUsers.get(recipientId);
        if (recipientSockets && recipientSockets.size > 0) {
          io.to(`user:${recipientId}`).emit('message:new', {
            messageId: message._id,
            sender: socket.userId,
            text,
            attachments,
            timestamp: message.createdAt
          });

          // Mark as delivered
          delivery.status = 'delivered';
          delivery.deliveredAt = new Date();
          await delivery.save();
        }

        // Acknowledge to sender
        socket.emit('message:ack', { messageId: message._id, status: 'sent' });
      } catch (err) {
        logger.error('Error sending message:', err);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('message:read', async (data) => {
      try {
        const { messageId } = data;
        const MessageDelivery = require('../models').MessageDelivery;

        const delivery = await MessageDelivery.findOneAndUpdate(
          { message: messageId, recipient: socket.userId },
          { status: 'read', readAt: new Date() },
          { new: true }
        );

        if (delivery) {
          const message = await delivery.populate('message');
          io.to(`user:${message.message.sender}`).emit('message:read', {
            messageId,
            readBy: socket.userId,
            readAt: delivery.readAt
          });
        }
      } catch (err) {
        logger.error('Error marking message as read:', err);
      }
    });

    // Handle homework submission notifications
    socket.on('homework:submitted', async (data) => {
      try {
        const { homeworkId, studentId } = data;
        const HomeworkNotification = require('../models').HomeworkNotification;

        // Create notification
        const notification = await HomeworkNotification.create({
          homework: homeworkId,
          student: studentId,
          type: 'submitted'
        });

        // Get homework to find teacher
        const Homework = require('../models').Homework;
        const homework = await Homework.findById(homeworkId);

        // Notify teacher
        io.to(`user:${homework.teacher}`).emit('homework:submission', {
          homeworkId,
          studentId,
          submittedAt: notification.createdAt
        });
      } catch (err) {
        logger.error('Error notifying homework submission:', err);
      }
    });

    // Handle homework graded notifications
    socket.on('homework:graded', async (data) => {
      try {
        const { homeworkId, studentId, marks, feedback } = data;
        const HomeworkNotification = require('../models').HomeworkNotification;

        // Create notification
        await HomeworkNotification.create({
          homework: homeworkId,
          student: studentId,
          type: 'graded'
        });

        // Notify student
        io.to(`user:${studentId}`).emit('homework:graded', {
          homeworkId,
          marks,
          feedback,
          timestamp: new Date()
        });
      } catch (err) {
        logger.error('Error notifying homework grading:', err);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userSockets = activeUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUsers.delete(socket.userId);
          io.emit('user:offline', { userId: socket.userId, status: 'offline' });
        }
      }
      logger.info(`User ${socket.userId} disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Helper function to get active user count
function getActiveUsersCount() {
  return activeUsers.size;
}

// Helper function to check if user is online
function isUserOnline(userId) {
  return activeUsers.has(userId) && activeUsers.get(userId).size > 0;
}

module.exports = { setupSocket, getActiveUsersCount, isUserOnline, activeUsers };
