const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
	addParentSchema,
	bulkImportSchema,
	listStudentsSchema,
	createStudentSchema,
	updateStudentSchema,
	admitStudentSchema
} = require('../validators/students');

// All routes require auth
router.use(requireAuth);

// List students (Admin/Principal/HR/Reception/Teacher)
router.get('/', requireRole('Admin', 'Principal', 'HR', 'Reception', 'Teacher'), validate(listStudentsSchema), studentController.listStudents);

// Admit student (Admin/Reception/Principal)
router.post('/admission', requireRole('Admin', 'Reception', 'Principal'), validate(admitStudentSchema), studentController.admitStudent);

// Create student (Admin/Reception)
router.post('/', requireRole('Admin', 'Reception'), validate(createStudentSchema), studentController.createStudent);

// Bulk import students (Admin and Reception)
router.post('/bulk', requireRole('Admin', 'Reception'), validate(bulkImportSchema), studentController.bulkImportStudents);

// Get student details with parents (all authenticated users)
router.get('/:studentId', studentController.getStudent);

// Update student (Admin/Reception)
router.patch('/:studentId', requireRole('Admin', 'Reception'), validate(updateStudentSchema), studentController.updateStudent);

// Admin-only routes for parent linking
router.post('/:studentId/parents', requireRole('Admin'), validate(addParentSchema), studentController.addParent);
router.delete('/:studentId/parents/:parentId', requireRole('Admin'), studentController.removeParent);

module.exports = router;
