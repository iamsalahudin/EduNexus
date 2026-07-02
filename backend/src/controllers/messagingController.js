const { Message, MessageDelivery, User, FCMToken } = require('../models');
const { sendPushNotification } = require('../utils/fcm');
const mongoose = require('mongoose');

// Send a message
async function sendMessage(req, res, next) {
  try {
    const { recipientId, text, attachments } = req.body;
    const senderId = req.user.id;

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    // Create message
    const message = await Message.create({
      sender: senderId,
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

    // Send push notification if enabled
    const fcmTokens = await FCMToken.countDocuments({ user: recipientId, isActive: true });
    if (fcmTokens > 0) {
      await sendPushNotification(recipientId, 'New Message', text, {
        type: 'message:new',
        senderId,
        messageId: message._id.toString()
      });
    }

    res.status(201).json({ message, delivery });
  } catch (err) {
    next(err);
  }
}

// Get conversation between two users
async function getConversation(req, res, next) {
  try {
    const { conversationWith } = req.params;
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: conversationWith },
        { sender: conversationWith, recipient: userId }
      ]
    })
      .populate('sender', 'name email')
      .populate('recipient', 'name email')
      .sort({ createdAt: 1 });

    // Mark all messages as read for current user
    await MessageDelivery.updateMany(
      { recipient: userId, status: { $in: ['sent', 'delivered'] }, message: { $in: messages.map((m) => m._id) } },
      { status: 'read', readAt: new Date() }
    );

    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

// Get all conversations (latest message per conversation)
async function getConversations(req, res, next) {
  try {
    const userId = req.user.id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: new mongoose.Types.ObjectId(userId) }, { recipient: new mongoose.Types.ObjectId(userId) }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$status', 'sent'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

// Mark message as read
async function markAsRead(req, res, next) {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const delivery = await MessageDelivery.findOneAndUpdate(
      { message: messageId, recipient: userId },
      { status: 'read', readAt: new Date() },
      { new: true }
    ).populate('message');

    if (!delivery) return res.status(404).json({ error: 'Not found' });

    res.json({ delivery });
  } catch (err) {
    next(err);
  }
}

// Get message delivery status
async function getDeliveryStatus(req, res, next) {
  try {
    const { messageId } = req.params;

    const statuses = await MessageDelivery.find({ message: messageId }).populate('recipient', 'name email');
    res.json({ statuses });
  } catch (err) {
    next(err);
  }
}

// Get unread messages count
async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;

    const unreadCount = await MessageDelivery.countDocuments({
      recipient: userId,
      status: { $in: ['sent', 'delivered'] }
    });

    res.json({ unreadCount });
  } catch (err) {
    next(err);
  }
}

// Delete message (soft delete by marking as deleted)
async function deleteMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({ _id: messageId, sender: userId });
    if (!message) return res.status(403).json({ error: 'Forbidden' });

    message.isDeleted = true;
    await message.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getDeliveryStatus,
  getUnreadCount,
  deleteMessage
};
