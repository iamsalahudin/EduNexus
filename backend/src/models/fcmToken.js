const mongoose = require('mongoose');

const FCMTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    deviceInfo: { type: String }, // device name/identifier
    isActive: { type: Boolean, default: true },
    registeredAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date }
  },
  { timestamps: true }
);

FCMTokenSchema.index({ user: 1, token: 1 }, { unique: true });
FCMTokenSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('FCMToken', FCMTokenSchema);
