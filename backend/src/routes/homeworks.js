const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createHomeworkSchema, submitHomeworkSchema, gradeSubmissionSchema, updateHomeworkSchema, getHomeworksQuerySchema } = require('../validators/homeworks');

// All routes require auth
router.use(requireAuth);

// Teacher: Create homework
router.post('/', requireRole('Teacher'), validate(createHomeworkSchema), homeworkController.createHomework);

// Get homeworks based on role
router.get('/', validate(getHomeworksQuerySchema), (req, res, next) => {
  const role = req.user.role;
  if (role === 'Teacher') return homeworkController.getHomeworksByTeacher(req, res, next);
  if (role === 'Student') return homeworkController.getHomeworksForStudent(req, res, next);
  if (role === 'Parent') return homeworkController.getHomeworksForParent(req, res, next);
  if (['Admin', 'Principal'].includes(role)) return homeworkController.getHomeworksByTeacher(req, res, next); // Can see all
  res.status(403).json({ error: 'Forbidden' });
});

// Get single homework
router.get('/:id', homeworkController.getHomework);

// Student: Submit homework
router.post('/:id/submit', requireRole('Student'), validate(submitHomeworkSchema), homeworkController.submitHomework);

// Teacher: Grade submission
router.post('/:id/grade', requireRole('Teacher'), validate(gradeSubmissionSchema), homeworkController.gradeSubmission);

// Teacher: Update homework
router.patch('/:id', requireRole('Teacher'), validate(updateHomeworkSchema), homeworkController.updateHomework);

module.exports = router;
