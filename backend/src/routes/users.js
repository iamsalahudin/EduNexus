const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const userUpdateSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    role: Joi.string().valid('Admin','Principal','Finance','HR','Reception','Teacher','Student','Parent'),
    active: Joi.boolean()
  })
});

// Admin-only user management
router.use(requireAuth, requireRole('Admin'));
router.get('/', userController.listUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', validate(userUpdateSchema), userController.updateUser);
router.patch('/:id/role', validate(Joi.object({ body: Joi.object({ role: Joi.string().valid('Admin','Principal','Finance','HR','Reception','Teacher','Student','Parent').required() }) })), userController.changeRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;
