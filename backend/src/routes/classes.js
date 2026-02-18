const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const classesController = require('../controllers/classesController');
const { listClassesSchema, createClassSchema, updateClassSchema } = require('../validators/classes');

// Read: any authenticated role (needed for teacher assignment/admission dropdowns)
router.get('/', requireAuth, validate(listClassesSchema), classesController.listClasses);

// Write: Admin-only
router.use(requireAuth, requireRole('Admin'));
router.post('/', validate(createClassSchema), classesController.createClass);
router.patch('/:id', validate(updateClassSchema), classesController.updateClass);
router.delete('/:id', classesController.deleteClass);

module.exports = router;
