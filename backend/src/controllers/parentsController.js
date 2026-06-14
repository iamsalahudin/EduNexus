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
    const { q, limit, page, sortBy, sortOrder } = req.query;
    const filter = {};
    const search = String(q || '').trim();

    const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
    const max = Math.min(parseInt(limit || '20', 10) || 20, 100);
    const skip = (pageNumber - 1) * max;

    const pipeline = [{ $match: filter }];
    
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      pipeline.push({
        $match: {
          $or: [{ name: regex }, { email: regex }, { phone: regex }, { cnic: regex }]
        }
      });
    }

    const [countRows, docs] = await Promise.all([
      Parent.aggregate([...pipeline, { $count: 'total' }]),
      Parent.aggregate([
        ...pipeline,
        { $sort: { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 } },
        { $skip: skip },
        { $limit: max }
      ])
    ]);

    res.json({
      parents: docs,
      pagination: { total: countRows?.[0]?.total || 0, page: pageNumber, limit: max }
    });
  } catch (err) {
    next(err);
  }
}

async function getParentById(req, res, next) {
  try {
    const parent = await Parent.findById(req.params.id).populate('user');
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    res.json({ parent });
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