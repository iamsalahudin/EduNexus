const mongoose = require('mongoose');

const PasswordResetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  verified: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

PasswordResetSchema.index({ email: 1 });
PasswordResetSchema.index({ otp: 1 });

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);
