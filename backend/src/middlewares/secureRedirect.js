// optional middleware to enforce HTTPS in production
function requireHttps(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    }
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
}

module.exports = { requireHttps };
