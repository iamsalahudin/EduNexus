const { User, Teacher } = require('../models');
const { sendWelcomeCredentialsEmail } = require('../services/mailService');
const { createWelcomeNotificationSafe } = require('../services/notificationService');

const EMAIL_ONBOARDING_ROLES = new Set(['Principal', 'HR', 'Finance', 'Reception']);

async function listUsers(req, res, next) {
  try {
    const { role, q, active, recentHours, limit, sortBy, sortOrder } = req.query;
    const filter = {};
    const sortableFields = new Set(['createdAt', 'updatedAt', 'name', 'username', 'email', 'role']);

    if (role) filter.role = String(role);

    if (active !== undefined && active !== '') {
      if (String(active).toLowerCase() === 'true') filter.active = true;
      else if (String(active).toLowerCase() === 'false') filter.active = false;
    }

    if (q) {
      const s = String(q).trim();
      if (s) {
        filter.$or = [
          { name: { $regex: s, $options: 'i' } },
          { username: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { 'profile.phone': { $regex: s, $options: 'i' } }
        ];
      }
    }

    if (recentHours !== undefined && recentHours !== '') {
      const hours = Number(recentHours);
      if (Number.isFinite(hours) && hours > 0) {
        filter.updatedAt = { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) };
      }
    }

    const max = Math.min(parseInt(limit || '200', 10) || 200, 500);
    const sortKey = sortableFields.has(String(sortBy)) ? String(sortBy) : 'createdAt';
    const sortDirection = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;
    const sort = { [sortKey]: sortDirection };

    // Use _id as stable tiebreaker so pagination/ordering stay deterministic.
    sort._id = -1;

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .limit(max);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, username, email, password, role, active, profile } = req.body;
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) return res.status(409).json({ error: 'Username already exists' });

    const user = await User.create({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role,
      active: typeof active === 'boolean' ? active : true,
      profile: profile && typeof profile === 'object' ? profile : {}
    });

    if (EMAIL_ONBOARDING_ROLES.has(String(role))) {
      try {
        await sendWelcomeCredentialsEmail({
          to: normalizedEmail,
          recipientName: name,
          roleLabel: String(role),
          username: normalizedUsername,
          temporaryPassword: password
        });
      } catch (mailErr) {
        await User.findByIdAndDelete(user._id);
        return res.status(mailErr.status || 502).json({
          error: mailErr.message || 'Failed to send welcome email. User was not created.'
        });
      }
    }

    const safe = await User.findById(user._id).select('-password');
    await createWelcomeNotificationSafe({
      userId: user._id,
      recipientName: user.name,
      role: user.role,
      createdBy: req.user?.id
    });
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

    if (updates.username) updates.username = String(updates.username).trim().toLowerCase();
    if (updates.email) updates.email = String(updates.email).toLowerCase();

    if (updates.username) {
      const sameUsername = await User.findOne({ username: updates.username, _id: { $ne: req.params.id } }).select('_id');
      if (sameUsername) return res.status(409).json({ error: 'Username already exists' });
    }

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
    const userId = req.params.id;
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) return res.status(404).json({ error: 'Not found' });

    // If the user is a teacher, delete their teacher record too
    if (deleted.role === 'Teacher') {
      const teacher = await Teacher.findOne({ user: userId });
      if (teacher) {
        // Delete associated teacher documents if any
        const docs = Array.isArray(teacher.documents) ? teacher.documents : [];
        if (docs.length > 0) {
          const { deleteCloudinaryAssetByUrl } = require('../services/cloudinaryService');
          await Promise.all(
            docs.map(async (url) => {
              try {
                await deleteCloudinaryAssetByUrl(url);
              } catch {
                // Ignore cleanup failures so business flow can continue
              }
            })
          );
        }

        // Delete the teacher record
        await Teacher.findByIdAndDelete(teacher._id);
      }
    }

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
