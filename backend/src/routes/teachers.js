const express = require('express');

const { requireAuth, requireRole } = require('../middlewares/auth');
const { createUploadMiddleware } = require('../middlewares/upload');
const validate = require('../middlewares/validate');
const controller = require('../controllers/teachersController');
const {
  listTeachersSchema,
  getTeacherSchema,
  createTeacherSchema,
  updateTeacherSchema
} = require('../validators/teachers');

const router = express.Router();

const upload = createUploadMiddleware({
  maxFileSizeMB: 10,
  maxFiles: 10
});

router.use(requireAuth);

router.get('/summary', requireRole('Admin', 'Principal', 'HR', 'Reception'), controller.getTeachersSummary);
router.get('/my-classes', requireRole('Teacher'), controller.getMyClasses);
router.get('/', requireRole('Admin', 'Principal', 'HR', 'Reception'), validate(listTeachersSchema), controller.listTeachers);
router.get('/:id', requireRole('Admin', 'Principal', 'HR', 'Reception'), validate(getTeacherSchema), controller.getTeacherById);
router.post('/', requireRole('Admin', 'Principal'), upload.array('documents', 10), validate(createTeacherSchema), controller.createTeacher);
router.patch('/:id', requireRole('Admin', 'Principal'), upload.array('documents', 10), validate(updateTeacherSchema), controller.updateTeacher);
router.delete('/:id', requireRole('Admin', 'Principal'), validate(getTeacherSchema), controller.deleteTeacher);

module.exports = router;
