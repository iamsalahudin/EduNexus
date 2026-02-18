const { User } = require('../models');

async function listDirectoryUsers(req, res, next) {
  try {
    const { role, q, limit } = req.query;
    const filter = { active: true };

    if (role) filter.role = String(role);

    const s = String(q || '').trim();
    if (s) {
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { 'profile.phone': { $regex: s, $options: 'i' } }
      ];
    }

    const max = Math.min(parseInt(limit || '50', 10) || 50, 200);

    const users = await User.find(filter)
      .select('name email role active profile createdAt')
      .sort({ createdAt: -1 })
      .limit(max);

    res.json({ users });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDirectoryUsers };
