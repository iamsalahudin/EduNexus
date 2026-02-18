const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    name: { type: String },
    url: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    kind: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const ChatMessageSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    senderType: { type: String, enum: ['user', 'agent', 'system'], required: true },
    senderUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    attachments: { type: [AttachmentSchema], default: [] },
    data: { type: mongoose.Schema.Types.Mixed },
    actions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    sources: { type: [mongoose.Schema.Types.Mixed], default: [] },
    toolCalls: { type: [mongoose.Schema.Types.Mixed], default: [] },
    error: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ session: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
