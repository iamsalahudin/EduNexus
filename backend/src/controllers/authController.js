const { User, RefreshToken } = require('../models');
const { signAccessToken, createRefreshToken } = require('../utils/jwt');
const config = require('../config');
const { createWelcomeNotificationSafe } = require('../services/notificationService');

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
    const normalizedUsername = String(username).trim().toLowerCase();
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // check account lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ error: 'Account locked due to multiple failed login attempts' });
    }

    const match = await user.comparePassword(password);
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

module.exports = { register, login, refresh, logout, changePassword };
