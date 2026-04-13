const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const classesController = require('../controllers/classesController');
const {
	listClassesSchema,
	createClassSchema,
	updateClassSchema,
	updateLevelsSchema,
	updateRoomsSchema
} = require('../validators/classes');

// Read: any authenticated role (needed for teacher assignment/admission dropdowns)
router.get('/', requireAuth, validate(listClassesSchema), classesController.listClasses);
router.get('/levels', requireAuth, classesController.listLevels);
router.get('/rooms', requireAuth, classesController.listRooms);

// Write: Admin and Principal
router.use(requireAuth, requireRole('Admin', 'Principal'));
router.put('/levels', validate(updateLevelsSchema), classesController.updateLevels);
router.put('/rooms', validate(updateRoomsSchema), classesController.updateRooms);
router.post('/', validate(createClassSchema), classesController.createClass);
router.patch('/:id', validate(updateClassSchema), classesController.updateClass);
router.delete('/:id', classesController.deleteClass);

module.exports = router;
