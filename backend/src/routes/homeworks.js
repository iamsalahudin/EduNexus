const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const multer = require('multer');
const {
  createHomeworkSchema,
  updateHomeworkSchema,
  getHomeworksQuerySchema,
  updateDraftSchema,
  receiveSubmissionSchema,
  returnSubmissionSchema
} = require('../validators/homeworks');

const upload = multer({ storage: multer.memoryStorage() });

// All routes require auth
router.use(requireAuth);

// Secure file streaming for inline preview
router.get('/files/:fileId', homeworkController.getHomeworkFile);

// Teacher: Create homework
router.post('/', requireRole('Teacher'), validate(createHomeworkSchema), homeworkController.createHomework);

// Get homeworks based on role
router.get('/', validate(getHomeworksQuerySchema), (req, res, next) => {
  const role = req.user.role;
  if (role === 'Teacher') return homeworkController.getHomeworksByTeacher(req, res, next);
  if (role === 'Student') return homeworkController.getHomeworksForStudent(req, res, next);
  if (role === 'Parent') return homeworkController.getHomeworksForParent(req, res, next);
  if (['Admin', 'Principal'].includes(role)) return homeworkController.getHomeworksForAdminPrincipal(req, res, next);
  res.status(403).json({ error: 'Forbidden' });
});

// Get single homework
router.get('/:id', homeworkController.getHomework);

// Teacher: Upload homework attachments (PDF/images)
router.post(
  '/:id/attachments',
  requireRole('Teacher'),
  upload.array('files', 10),
  homeworkController.uploadAttachments
);

// Student: Update draft (text)
router.put(
  '/:id/submission',
  requireRole('Student'),
  validate(updateDraftSchema),
  homeworkController.updateSubmissionDraft
);

// Student: Upload submission files (PDF/images)
router.post(
  '/:id/submission/files',
  requireRole('Student'),
  upload.array('files', 10),
  homeworkController.uploadSubmissionFiles
);

// Student: Submit homework
router.post('/:id/submit', requireRole('Student'), homeworkController.submitHomework);

// Student: Cancel submission (until due date, unless received/returned)
router.post('/:id/cancel', requireRole('Student'), homeworkController.cancelSubmission);

// Teacher: Mark received (checked)
router.post(
  '/:id/receive',
  requireRole('Teacher'),
  validate(receiveSubmissionSchema),
  homeworkController.receiveSubmission
);

// Teacher: Return (feedback/marks)
router.post(
  '/:id/return',
  requireRole('Teacher'),
  validate(returnSubmissionSchema),
  homeworkController.gradeSubmission
);

// Teacher: Update homework
router.patch('/:id', requireRole('Teacher'), validate(updateHomeworkSchema), homeworkController.updateHomework);

module.exports = router;
