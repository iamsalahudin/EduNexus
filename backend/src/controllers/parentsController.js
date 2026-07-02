const { Parent, User } = require('../models');
const { sendWelcomeCredentialsEmail } = require('../services/mailService');
const { createWelcomeNotificationSafe } = require('../services/notificationService');

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generatePassword(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return password;
}

async function getParentsSummary(req, res, next) {
  try {
    const total = await Parent.countDocuments({});
    res.json({ summary: { total } });
  } catch (err) {
    next(err);
  }
}

async function listParents(req, res, next) {
  try {
    const { q, limit, page, sortBy, sortOrder, recentHours, active } = req.query;
    const filter = {};
    const search = String(q || '').trim();

    if (recentHours !== undefined && recentHours !== '') {
      const hours = Number(recentHours);
      if (Number.isFinite(hours) && hours > 0) {
        filter.updatedAt = { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) };
      }
    }

    let activeFilter;
    if (active !== undefined && active !== '') {
      if (String(active).toLowerCase() === 'true') activeFilter = true;
      if (String(active).toLowerCase() === 'false') activeFilter = false;
    }

    const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
    const max = Math.min(parseInt(limit || '20', 10) || 20, 100);
    const skip = (pageNumber - 1) * max;

    const sortableFields = new Set(['createdAt', 'updatedAt', 'name', 'email', 'phone']);
    const sortKey = sortableFields.has(String(sortBy)) ? String(sortBy) : 'updatedAt';
    const direction = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDoc'
        }
      },
      { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } }
    ];

    if (activeFilter !== undefined) {
      pipeline.push({ $match: { 'userDoc.active': activeFilter } });
    }
    
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      pipeline.push({
        $match: {
          $or: [
            { name: regex },
            { email: regex },
            { phone: regex },
            { cnic: regex },
            { 'userDoc.name': regex },
            { 'userDoc.username': regex },
            { 'userDoc.email': regex }
          ]
        }
      });
    }

    const [countRows, docs] = await Promise.all([
      Parent.aggregate([...pipeline, { $count: 'total' }]),
      Parent.aggregate([
        ...pipeline,
        { $sort: { [sortKey]: direction, _id: -1 } },
        { $skip: skip },
        { $limit: max },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            cnic: 1,
            dob: 1,
            occupation: 1,
            salary: 1,
            relation: 1,
            address: 1,
            createdAt: 1,
            updatedAt: 1,
            user: {
              _id: '$userDoc._id',
              name: '$userDoc.name',
              username: '$userDoc.username',
              email: '$userDoc.email',
              active: '$userDoc.active',
              role: '$userDoc.role'
            },
            status: {
              $cond: [{ $eq: ['$userDoc.active', false] }, 'Inactive', 'Active']
            }
          }
        }
      ])
    ]);

    const total = countRows?.[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / max), 1);

    res.json({
      parents: docs,
      pagination: {
        total,
        page: Math.min(pageNumber, totalPages),
        limit: max,
        totalPages,
        hasPrev: pageNumber > 1,
        hasNext: pageNumber < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getParentById(req, res, next) {
  try {
    const parent = await Parent.findById(req.params.id).populate('user', 'name username email active role profile');
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const doc = parent.toObject();
    doc.status = doc?.user?.active === false ? 'Inactive' : 'Active';
    res.json({ parent: doc });
  } catch (err) {
    next(err);
  }
}

async function createParent(req, res, next) {
  try {
    const { name, email, phone, cnic, dob, occupation, salary, relation, address, username } = req.body;
    
    const generatedPassword = generatePassword();
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username || email.toLowerCase(),
      password: generatedPassword,
      role: 'Parent'
    });

    const parent = await Parent.create({
      user: user._id,
      name,
      email: email.toLowerCase(),
      phone,
      cnic,
      dob,
      occupation,
      salary,
      relation,
      address
    });

    await sendWelcomeCredentialsEmail({ to: email, recipientName: name, roleLabel: 'Parent', username: user.username, temporaryPassword: generatedPassword });
    await createWelcomeNotificationSafe({ userId: user._id, recipientName: name, role: 'Parent', createdBy: req.user?.id });

    res.status(201).json({ parent });
  } catch (err) {
    next(err);
  }
}

async function updateParent(req, res, next) {
  try {
    const parent = await Parent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    res.json({ parent });
  } catch (err) {
    next(err);
  }
}

async function deleteParent(req, res, next) {
  try {
    const parent = await Parent.findById(req.params.id);
    if (parent) {
      await User.findByIdAndDelete(parent.user);
      await Parent.findByIdAndDelete(parent._id);
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getParentsSummary,
  listParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent
};