const { User, RefreshToken } = require('../models');
const { signAccessToken, createRefreshToken } = require('../utils/jwt');
const config = require('../config');

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    // Allow self-register only for Student and Parent roles.
    const highRoles = ['Admin', 'Principal', 'Finance', 'HR', 'Reception', 'Teacher'];
    if (role && highRoles.includes(role)) {
      // require admin privileges to create high privilege accounts
      if (!req.user || req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Only admin can create this role' });
      }
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, role: role || 'Student' });
    const out = user.toObject();
    delete out.password;
    res.status(201).json({ user: out });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    const user = await User.findOne({ email });
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

    res.json({ accessToken, user: { id: user._id, role: user.role, email: user.email } });
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

module.exports = { register, login, refresh, logout };
