const { User } = require('../models');

async function listUsers(req, res, next) {
  try {
    const { role, q, limit } = req.query;
    const filter = {};

    if (role) filter.role = String(role);

    if (q) {
      const s = String(q).trim();
      if (s) {
        filter.$or = [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { 'profile.phone': { $regex: s, $options: 'i' } }
        ];
      }
    }

    const max = Math.min(parseInt(limit || '200', 10) || 200, 500);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(max);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, active, profile } = req.body;
    const normalizedEmail = String(email).toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      active: typeof active === 'boolean' ? active : true,
      profile: profile && typeof profile === 'object' ? profile : {}
    });

    const safe = await User.findById(user._id).select('-password');
    res.status(201).json({ user: safe });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const updates = { ...(req.body || {}) };

    if (Object.prototype.hasOwnProperty.call(updates, 'password')) {
      delete updates.password;
    }

    if (updates.email) updates.email = String(updates.email).toLowerCase();

    if (updates.profile && typeof updates.profile === 'object') {
      const existing = await User.findById(req.params.id).select('profile');
      if (!existing) return res.status(404).json({ error: 'Not found' });
      const existingProfile = existing.profile && typeof existing.profile === 'object' ? existing.profile : {};
      updates.profile = { ...existingProfile, ...updates.profile };
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function changeRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, getUser, updateUser, deleteUser, changeRole };
