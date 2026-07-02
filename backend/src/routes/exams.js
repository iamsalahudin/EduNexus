const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const examsController = require('../controllers/examsController');
const {
  listExamConfigsSchema,
  updateExamConfigSchema,
  listExamsSchema,
  setupSummarySchema,
  bulkSetupSchema,
  createExamSchema,
  updateExamSchema,
  getExamSchema,
  hardDeleteExamSchema,
  teacherAssignmentsSchema,
  getMarksSheetSchema,
  upsertMarksSchema
} = require('../validators/exams');

router.use(requireAuth);

// Exam configs (Admin/Principal)
router.get('/configs', requireRole('Admin', 'Principal'), validate(listExamConfigsSchema), examsController.listExamConfigs);
router.post('/configs/ensure-defaults', requireRole('Admin', 'Principal'), examsController.ensureConfigs);
router.get('/configs/:id', requireRole('Admin', 'Principal'), examsController.getExamConfig);
router.patch('/configs/:id', requireRole('Admin', 'Principal'), validate(updateExamConfigSchema), examsController.updateExamConfig);

// Exams (Schedule / instances)
router.get('/', requireRole('Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'Reception'), validate(listExamsSchema), examsController.listExams);
router.get('/setup-summary', requireRole('Admin', 'Principal'), validate(setupSummarySchema), examsController.listExamSetupSummary);
router.post('/bulk-setup', requireRole('Admin', 'Principal'), validate(bulkSetupSchema), examsController.createExamsForAllClasses);
router.get('/teacher-assignments', requireRole('Teacher'), validate(teacherAssignmentsSchema), examsController.getTeacherAssignments);
router.post('/', requireRole('Admin', 'Principal'), validate(createExamSchema), examsController.createExam);
router.get('/:id', requireRole('Admin', 'Principal', 'Teacher', 'Student', 'Parent', 'Reception'), validate(getExamSchema), examsController.getExam);
router.patch('/:id', requireRole('Admin', 'Principal'), validate(updateExamSchema), examsController.updateExam);
router.post('/:id/archive', requireRole('Admin', 'Principal'), validate(getExamSchema), examsController.archiveExam);
router.delete('/:id', requireRole('Admin', 'Principal'), validate(hardDeleteExamSchema), examsController.hardDeleteExam);

// Marks entry (Teacher + Admin/Principal)
router.get('/:id/marks', requireRole('Admin', 'Principal', 'Teacher'), validate(getMarksSheetSchema), examsController.getMarksSheet);
router.put('/:id/marks', requireRole('Admin', 'Principal', 'Teacher'), validate(upsertMarksSchema), examsController.upsertMarks);

// Workflow actions (Admin/Principal)
router.post('/:id/actions/open', requireRole('Admin', 'Principal'), examsController.openExam);
router.post('/:id/actions/lock', requireRole('Admin', 'Principal'), examsController.lockExam);
router.post('/:id/actions/submit', requireRole('Teacher'), examsController.submitExam);
router.post('/:id/actions/approve', requireRole('Admin', 'Principal'), examsController.approveExam);
router.post('/:id/actions/publish', requireRole('Admin', 'Principal'), examsController.publishExam);

module.exports = router;
