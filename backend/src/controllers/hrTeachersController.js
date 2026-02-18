const { User } = require('../models');

function pickTeacherUpdates(body) {
  const updates = {};
  if (typeof body.name === 'string') updates.name = body.name;
  if (typeof body.email === 'string') updates.email = String(body.email).toLowerCase();
  if (typeof body.active === 'boolean') updates.active = body.active;
  if (body.profile && typeof body.profile === 'object') {
    const profile = {};
    if (Object.prototype.hasOwnProperty.call(body.profile, 'class')) profile.class = body.profile.class;
    if (Object.prototype.hasOwnProperty.call(body.profile, 'section')) profile.section = body.profile.section;
    updates.profile = profile;
  }
  return updates;
}

async function listTeachers(req, res, next) {
  try {
    const { q, limit } = req.query;
    const filter = { role: 'Teacher' };

    const s = String(q || '').trim();
    if (s) {
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } }
      ];
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

async function createTeacher(req, res, next) {
  try {
    const { name, email, password, active, profile } = req.body;
    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: 'Teacher',
      active: typeof active === 'boolean' ? active : true,
      profile: profile && typeof profile === 'object' ? profile : {}
    });

    const safe = await User.findById(user._id).select('-password');
    res.status(201).json({ user: safe });
  } catch (err) {
    next(err);
  }
}

async function updateTeacher(req, res, next) {
  try {
    const updates = pickTeacherUpdates(req.body || {});

    // Ensure target is a teacher
    const existing = await User.findById(req.params.id).select('role profile');
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.role !== 'Teacher') return res.status(403).json({ error: 'Only Teacher accounts can be updated here' });

    // email uniqueness check when changing
    if (updates.email) {
      const same = await User.findOne({ email: updates.email, _id: { $ne: existing._id } }).select('_id');
      if (same) return res.status(409).json({ error: 'Email already exists' });
    }

    if (updates.profile) {
      const existingProfile = existing.profile && typeof existing.profile === 'object' ? existing.profile : {};
      updates.profile = { ...existingProfile, ...updates.profile };
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTeachers, createTeacher, updateTeacher };
