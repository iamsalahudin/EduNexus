const { User } = require('../models');

async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
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
    const updates = req.body;
    if (updates.password) delete updates.password; // password changes via dedicated endpoint
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, getUser, updateUser, deleteUser };
