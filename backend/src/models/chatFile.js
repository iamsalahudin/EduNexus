const mongoose = require('mongoose');

const ChatFileSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    meta: { type: mongoose.Schema.Types.Mixed },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

ChatFileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } });

module.exports = mongoose.model('ChatFile', ChatFileSchema);
