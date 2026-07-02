const mongoose = require('mongoose');

const HomeworkNotificationSchema = new mongoose.Schema(
  {
    homework: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['posted', 'deadline_reminder', 'graded', 'returned'], required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
  },
  { timestamps: true }
);

HomeworkNotificationSchema.index({ homework: 1, student: 1 });
HomeworkNotificationSchema.index({ student: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('HomeworkNotification', HomeworkNotificationSchema);
