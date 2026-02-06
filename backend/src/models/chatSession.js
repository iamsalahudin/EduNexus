const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionKey: { type: String, required: true },
    roleAtCreation: { type: String, required: true },
    allowedScopes: { type: [String], default: [] },
    title: { type: String },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

ChatSessionSchema.index({ user: 1, sessionKey: 1 }, { unique: true });
ChatSessionSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
