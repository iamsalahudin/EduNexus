const { User } = require('../models');

async function listDirectoryUsers(req, res, next) {
  try {
    const { role, q, active, limit, excludeRoles, sortBy, sortOrder, userId, mobile } = req.query;
    const filter = {};
    const sortableFields = new Set(['createdAt', 'updatedAt', 'name', 'email', 'role']);

    if (role) filter.role = String(role);

    if (active !== undefined && active !== '') {
      if (String(active).toLowerCase() === 'true') filter.active = true;
      else if (String(active).toLowerCase() === 'false') filter.active = false;
    }

    if (excludeRoles) {
      const excluded = String(excludeRoles)
        .split(',')
        .map((item) => String(item || '').trim())
        .filter(Boolean);

      if (excluded.length > 0) {
        filter.role = { ...(filter.role ? { $eq: filter.role } : {}), $nin: excluded };
      }
    }

    const s = String(q || '').trim();
    if (s) {
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { 'profile.phone': { $regex: s, $options: 'i' } }
      ];
    }

    const explicitUserId = String(userId || '').trim();
    if (explicitUserId) {
      if (explicitUserId.length === 24 && /^[a-f\d]{24}$/i.test(explicitUserId)) {
        filter._id = explicitUserId;
      } else {
        filter._id = { $exists: true };
      }
    }

    const explicitMobile = String(mobile || '').trim();
    if (explicitMobile) {
      filter['profile.phone'] = { $regex: explicitMobile, $options: 'i' };
    }

    const max = Math.min(parseInt(limit || '200', 10) || 200, 500);
    const sortKey = sortableFields.has(String(sortBy)) ? String(sortBy) : 'updatedAt';
    const sortDirection = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;
    const sort = { [sortKey]: sortDirection, _id: -1 };

    const users = await User.find(filter)
      .select('name email role active profile createdAt updatedAt')
      .sort(sort)
      .limit(max);

    const finalUsers = explicitUserId && explicitUserId.length !== 24
      ? users.filter((user) => String(user._id || '').includes(explicitUserId))
      : users;

    res.json({ users: finalUsers });
  } catch (err) {
    next(err);
  }
}

module.exports = { listDirectoryUsers };
