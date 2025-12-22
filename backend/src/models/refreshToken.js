const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// support for rotation
RefreshTokenSchema.add({ replacedByToken: { type: String } });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
