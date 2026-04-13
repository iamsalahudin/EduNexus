const mongoose = require('mongoose');

const ThreadMessageSchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    byRole: { type: String },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const NotificationSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['broadcast', 'request'], required: true, index: true },

    // Broadcast
    scope: { type: String, enum: ['global', 'role', 'targeted'], index: true },
    category: {
      type: String,
      enum: ['critical', 'normal', 'pending', 'reminder', 'info', 'success', 'warning', 'system'],
      default: 'normal',
      index: true
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },

    // Optional expiry for broadcasts
    expiresAt: { type: Date, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Targeting (for role/targeted). Keep fields flat for fast querying.
    targetRoles: { type: [String], default: [], index: true },
    targetLevels: { type: [String], default: [] }, // pre-primary|primary|middle
    targetClass: { type: String, index: true },
    targetSection: { type: String, index: true },
    targetStudents: { type: [mongoose.Schema.Types.ObjectId], ref: 'Student', default: [] },
    targetUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

    // Requests
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, enum: ['pending', 'replied', 'closed'], default: 'pending', index: true },
    thread: { type: [ThreadMessageSchema], default: [] }
  },
  { timestamps: true }
);

NotificationSchema.index({ kind: 1, createdAt: -1 });
NotificationSchema.index({ kind: 1, scope: 1, createdAt: -1 });
NotificationSchema.index({ kind: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ kind: 1, expiresAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
