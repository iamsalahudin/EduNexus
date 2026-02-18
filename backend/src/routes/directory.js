const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const directoryController = require('../controllers/directoryController');
const { listDirectoryUsersSchema } = require('../validators/directory');

router.use(requireAuth);

// Directory users lookup for role pages (safe subset of fields)
router.get(
  '/users',
  requireRole('Admin', 'Principal', 'HR', 'Reception'),
  validate(listDirectoryUsersSchema),
  directoryController.listDirectoryUsers
);

module.exports = router;
