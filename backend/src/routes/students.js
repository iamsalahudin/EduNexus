const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { addParentSchema, bulkImportSchema } = require('../validators/students');

// All routes require auth
router.use(requireAuth);

// Get student details with parents (all authenticated users)
router.get('/:studentId', studentController.getStudent);

// Admin-only routes for parent linking
router.post('/:studentId/parents', requireRole('Admin'), validate(addParentSchema), studentController.addParent);
router.delete('/:studentId/parents/:parentId', requireRole('Admin'), studentController.removeParent);

// Bulk import students (Admin and Reception)
router.post('/bulk', requireRole('Admin', 'Reception'), validate(bulkImportSchema), studentController.bulkImportStudents);

module.exports = router;
