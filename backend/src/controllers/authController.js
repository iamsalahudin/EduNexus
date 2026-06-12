const { User, RefreshToken } = require('../models');
const PasswordReset = require('../models/passwordReset');
const { signAccessToken, createRefreshToken } = require('../utils/jwt');
const config = require('../config');
const { createWelcomeNotificationSafe } = require('../services/notificationService');
const mailService = require('../services/mailService');
const bcrypt = require('bcryptjs');

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]?\$/.test(value);
}

async function register(req, res, next) {
  try {
    const { name, username, email, password, role } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    // Allow self-register only for Student and Parent roles.
    const highRoles = ['Admin', 'Principal', 'Finance', 'HR', 'Teacher'];
    if (role && highRoles.includes(role)) {
      // require admin privileges to create high-privilege accounts
      if (!req.user || req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Only admin can create this role' });
      }
    }
    // Reception can create Student and Parent
    if (role && ['Student', 'Parent'].includes(role)) {
      if (req.user && !['Admin', 'Reception'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only admin or reception can create this role' });
      }
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) return res.status(409).json({ error: 'Username already registered' });

    const user = await User.create({ name, username: normalizedUsername, email: normalizedEmail, password, role: role || 'Student' });
    await createWelcomeNotificationSafe({
      userId: user._id,
      recipientName: user.name,
      role: user.role,
      createdBy: req.user?.id
    });
    const out = user.toObject();
    delete out.password;
    res.status(201).json({ user: out });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    const loginIdentifier = String(username).trim();
    const loginPattern = new RegExp(`^${escapeRegExp(loginIdentifier)}$`, 'i');
    const user = await User.findOne({
      $or: [{ username: loginPattern }, { email: loginPattern }]
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // check account lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ error: 'Account locked due to multiple failed login attempts' });
    }

    let match = false;
    if (isBcryptHash(user.password)) {
      match = await bcrypt.compare(password, user.password);
    } else if (typeof user.password === 'string') {
      match = user.password === password;
      if (match) {
        user.password = password;
        user.markModified('password');
        await user.save();
      }
    }
    if (!match) {
      await user.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // reset failed attempts after successful login
    await user.resetLoginAttempts();

    const accessToken = signAccessToken(user, process.env.ACCESS_TOKEN_EXPIRES || '15m');
    const refreshTokenValue = createRefreshToken();
    const expiresDays = parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10);
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    await RefreshToken.create({ token: refreshTokenValue, user: user._id, expiresAt });

    // set refresh token as HttpOnly secure cookie
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    };
    res.cookie('refreshToken', refreshTokenValue, cookieOpts);

    res.json({ accessToken, user: { id: user._id, role: user.role, username: user.username, email: user.email } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    // read refresh token from cookie first, fallback to body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored || stored.revoked) return res.status(401).json({ error: 'Invalid refresh token' });
    if (stored.expiresAt < new Date()) return res.status(401).json({ error: 'Refresh token expired' });

    const user = await User.findById(stored.user);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // rotate: issue new refresh token and revoke old one
    const newRefreshToken = createRefreshToken();
    const expiresDaysNew = parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10);
    const expiresAtNew = new Date(Date.now() + expiresDaysNew * 24 * 60 * 60 * 1000);

    stored.revoked = true;
    stored.replacedByToken = newRefreshToken;
    await stored.save();

    await RefreshToken.create({ token: newRefreshToken, user: user._id, expiresAt: expiresAtNew });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAtNew
    };
    res.cookie('refreshToken', newRefreshToken, cookieOpts);

    const accessToken = signAccessToken(user, process.env.ACCESS_TOKEN_EXPIRES || '15m');
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    // support cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });
    await RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: true });
    res.clearCookie('refreshToken');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Need password hash for compare, so fetch with password
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await user.comparePassword(oldPassword);
    if (!match) return res.status(401).json({ error: 'Old password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function sendOtp(req, res, next) {
  try {
    const { username, email } = req.body;
    if (!username || !email) return res.status(400).json({ error: 'Missing fields' });

    const normalizedUsername = username ? String(username).trim().toLowerCase() : null;
    const normalizedEmail = String(email).trim().toLowerCase();
    let user = null;
    if (normalizedUsername) user = await User.findOne({ username: normalizedUsername });
    if (!user) user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (String(user.email).trim().toLowerCase() !== normalizedEmail) {
      return res.status(400).json({ error: 'Email does not match username' });
    }

    // create 4-digit OTP to match frontend length
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await PasswordReset.create({ user: user._id, email: normalizedEmail, otp, expiresAt });

    // send mail (will throw if not configured)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const subject = 'EduNexus Password Reset OTP';
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <p>Hello ${user.name || user.username},</p>
        <p>Your password reset code is <strong>${otp}</strong>. It expires in 10 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
        <p>Login page: <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>
      </div>
    `;
    const text = `Your EduNexus password reset code is ${otp}. It expires in 10 minutes.`;

    if (mailService.isConfigured()) {
      await mailService.sendMail({ to: normalizedEmail, subject, html, text });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Missing fields' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const reset = await PasswordReset.findOne({ email: normalizedEmail, otp, used: false }).sort({ createdAt: -1 });
    if (!reset) return res.status(400).json({ error: 'Invalid or expired OTP' });
    if (reset.expiresAt < new Date()) return res.status(400).json({ error: 'OTP expired' });

    reset.verified = true;
    await reset.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const reset = await PasswordReset.findOne({ email: normalizedEmail, verified: true, used: false }).sort({ createdAt: -1 });
    if (!reset) return res.status(400).json({ error: 'No verified reset request found' });
    if (reset.expiresAt < new Date()) return res.status(400).json({ error: 'Reset request expired' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = password;
    await user.save();

    reset.used = true;
    await reset.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, phone } = req.body;

    // Validate and update name
    if (name) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
      user.name = trimmedName;
    }

    // Validate and update email (must be unique)
    if (email) {
      const trimmedEmail = String(email).trim().toLowerCase();
      const existing = await User.findOne({ email: trimmedEmail, _id: { $ne: userId } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
      user.email = trimmedEmail;
    }

    // Update profile phone if provided
    if (phone) {
      if (!user.profile) user.profile = {};
      user.profile.phone = String(phone).trim();
    }

    await user.save();

    const out = user.toObject();
    delete out.password;
    res.json({ user: out });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, changePassword, sendOtp, verifyOtp, resetPassword, updateProfile };
