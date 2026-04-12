const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { createUploadMiddleware } = require('../middlewares/upload');
const validate = require('../middlewares/validate');
const {
	addParentSchema,
	bulkImportSchema,
	listStudentsSchema,
	createStudentSchema,
	updateStudentSchema,
	admitStudentSchema
} = require('../validators/students');

const upload = createUploadMiddleware({
	maxFileSizeMB: 10,
	maxFiles: 12,
	allowedMimeTypes: [
		'image/jpeg',
		'image/png',
		'image/webp',
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	]
});

// All routes require auth
router.use(requireAuth);

// List students (Admin/Principal/HR/Reception/Teacher)
router.get('/', requireRole('Admin', 'Principal', 'HR', 'Reception', 'Teacher'), validate(listStudentsSchema), studentController.listStudents);

// Students summary (Admin/Principal/HR/Reception/Teacher)
router.get('/summary', requireRole('Admin', 'Principal', 'HR', 'Reception', 'Teacher'), studentController.getStudentsSummary);

// Search existing parents for admission popup
router.get('/parents/search', requireRole('Admin', 'Principal', 'HR', 'Reception'), studentController.searchParents);

// Admit student (Admin/Reception/Principal)
router.post(
	'/admission',
	requireRole('Admin', 'Reception', 'Principal', 'HR'),
	upload.fields([
		{ name: 'profilePicture', maxCount: 1 },
		{ name: 'documents', maxCount: 10 }
	]),
	studentController.admitStudent
);

// Create student (Admin/Reception)
router.post('/', requireRole('Admin', 'Reception'), validate(createStudentSchema), studentController.createStudent);

// Bulk import students (Admin and Reception)
router.post('/bulk', requireRole('Admin', 'Reception'), validate(bulkImportSchema), studentController.bulkImportStudents);

// Get student details with parents (all authenticated users)
router.get('/:studentId', studentController.getStudent);

// Update student (Admin/Principal/Reception)
router.patch('/:studentId', requireRole('Admin', 'Principal', 'Reception'), validate(updateStudentSchema), studentController.updateStudent);

// Delete student (Admin/Reception)
router.delete('/:studentId', requireRole('Admin', 'Reception'), studentController.deleteStudent);

// Admin-only routes for parent linking
router.post('/:studentId/parents', requireRole('Admin'), validate(addParentSchema), studentController.addParent);
router.delete('/:studentId/parents/:parentId', requireRole('Admin'), studentController.removeParent);

module.exports = router;
