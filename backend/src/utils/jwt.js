const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret } = require('../config');

function signAccessToken(user, expiresIn = '60m') {
  const payload = { sub: user._id.toString(), role: user.role, username: user.username, email: user.email };
  return jwt.sign(payload, jwtSecret, { expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret);
}

function createRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

module.exports = { signAccessToken, verifyAccessToken, createRefreshToken };
