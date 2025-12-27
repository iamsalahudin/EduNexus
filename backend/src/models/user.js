const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Admin','Principal','Finance','HR','Reception','Teacher','Student','Parent'], default: 'Teacher' },
    active: { type: Boolean, default: true },
    profile: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

  // fields for lockout
  UserSchema.add({
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
  });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Account lockout helpers
UserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.methods.incLoginAttempts = async function () {
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
  const MAX_ATTEMPTS = 5;

  if (this.lockUntil && this.lockUntil < Date.now()) {
    // lock has expired, reset
    this.failedLoginAttempts = 1;
    this.lockUntil = undefined;
    await this.save();
    return;
  }

  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = Date.now() + LOCK_TIME;
  }
  await this.save();
};

UserSchema.methods.resetLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

module.exports = mongoose.model('User', UserSchema);
