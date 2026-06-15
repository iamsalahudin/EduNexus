const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const ADMIN_MANAGED_ROLES = ['Principal', 'HR', 'Finance', 'Reception'];

const userCreateSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(200).required(),
    role: Joi.string().valid(...ADMIN_MANAGED_ROLES).required(),
    active: Joi.boolean(),
    profile: Joi.object().unknown(true)
  })
});

const userUpdateSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    username: Joi.string().min(3).max(50),
    email: Joi.string().email(),
    role: Joi.string().valid(...ADMIN_MANAGED_ROLES),
    active: Joi.boolean(),
    profile: Joi.object({
      class: Joi.alternatives().try(Joi.string(), Joi.number()),
      section: Joi.string().allow(''),
      studentRef: Joi.string(),
      studentId: Joi.string().allow(''),
      phone: Joi.string().allow('')
    }).unknown(true)
  })
});

// Admin + Principal user management (principal is restricted in controller)
router.use(requireAuth, requireRole('Admin', 'Principal'));

// Principal can create staff users too (controller restricts role to HR/Finance/Reception).
router.post('/', requireRole('Admin', 'Principal'), validate(userCreateSchema), userController.createUser);
// Role change + delete remain Admin-only - they are platform-wide actions.
router.patch('/:id/role', requireRole('Admin'), validate(Joi.object({ body: Joi.object({ role: Joi.string().valid(...ADMIN_MANAGED_ROLES).required() }) })), userController.changeRole);
router.delete('/:id', requireRole('Admin'), userController.deleteUser);

// Admin + Principal read/update operations (with principal restrictions in controller).
router.get('/', userController.listUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', validate(userUpdateSchema), userController.updateUser);

module.exports = router;
