const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { User } = require('../models');

function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ error: message });
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return unauthorized(res);
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub).select('-password');
    if (!user) return unauthorized(res, 'User not found');
    // attach full user object for downstream checks
    req.user = {
      id: user._id,
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      active: user.active,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    next();
  } catch (err) {
    return unauthorized(res, err.message || 'Invalid token');
  }
}

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { requireAuth, requireRole };
