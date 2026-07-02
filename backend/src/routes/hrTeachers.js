const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const hrTeachersController = require('../controllers/hrTeachersController');
const { listTeachersSchema, createTeacherSchema, updateTeacherSchema } = require('../validators/hrTeachers');

router.use(requireAuth, requireRole('HR'));

router.get('/', validate(listTeachersSchema), hrTeachersController.listTeachers);
router.post('/', validate(createTeacherSchema), hrTeachersController.createTeacher);
router.patch('/:id', validate(updateTeacherSchema), hrTeachersController.updateTeacher);

module.exports = router;
