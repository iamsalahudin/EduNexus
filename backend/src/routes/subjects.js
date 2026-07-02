const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const subjectsController = require('../controllers/subjectsController');
const {
  listSubjectsSchema,
  createSubjectSchema,
  updateSubjectSchema,
  reorderSubjectsSchema,
  applyDefaultSubjectsSchema
} = require('../validators/subjects');

// Read: any authenticated role
router.get('/', requireAuth, validate(listSubjectsSchema), subjectsController.listSubjects);

// Write: Admin and Principal
router.use(requireAuth, requireRole('Admin', 'Principal'));
router.post('/', validate(createSubjectSchema), subjectsController.createSubject);
router.patch('/:id', validate(updateSubjectSchema), subjectsController.updateSubject);
router.delete('/:id', subjectsController.deleteSubject);
router.put('/reorder', validate(reorderSubjectsSchema), subjectsController.reorderSubjects);
router.post('/apply-defaults', validate(applyDefaultSubjectsSchema), subjectsController.applyDefaultSubjects);

module.exports = router;
