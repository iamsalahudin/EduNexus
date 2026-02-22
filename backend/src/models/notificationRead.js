const mongoose = require('mongoose');

const NotificationReadSchema = new mongoose.Schema(
  {
    notification: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    readAt: { type: Date, default: Date.now },
    dismissedAt: { type: Date }
  },
  { timestamps: true }
);

NotificationReadSchema.index({ notification: 1, user: 1 }, { unique: true });
NotificationReadSchema.index({ user: 1, readAt: -1 });
NotificationReadSchema.index({ user: 1, dismissedAt: -1 });

module.exports = mongoose.model('NotificationRead', NotificationReadSchema);
