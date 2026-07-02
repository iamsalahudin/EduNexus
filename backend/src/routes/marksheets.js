const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { createUploadMiddleware } = require('../middlewares/upload');
const {
  listMarksheets,
  getMarksheetDetail,
  updateStudentMarks,
  updateGRMarks,
  updateTeacherComments,
  lockMarksheet,
  unlockMarksheet,
  publishMarksheet,
  importMarksheetCsv,
  exportMarksheetCsv,
  exportMarksheetPdf
} = require('../controllers/marksheetController');

const router = express.Router();
const csvUpload = createUploadMiddleware({
  maxFileSizeMB: 5,
  maxFiles: 1,
  allowedMimeTypes: ['text/csv', 'text/plain', 'application/vnd.ms-excel']
});

// All routes require authentication
router.use(requireAuth);

// Export marksheet
router.get('/:id/export/csv', exportMarksheetCsv);
router.get('/:id/export/pdf', exportMarksheetPdf);
router.post('/:id/import/csv', csvUpload.single('file'), importMarksheetCsv);

// List marksheets for an exam
router.get('/', listMarksheets);

// Get marksheet detail
router.get('/:id', getMarksheetDetail);

// Update student marks (teacher/admin)
router.patch('/:id/student-marks', updateStudentMarks);

// Update GR marks (admin/principal/class-teacher)
router.patch('/:id/gr-marks', updateGRMarks);

// Update teacher comments
router.patch('/:id/teacher-comments', updateTeacherComments);

// Lock marksheet (admin/principal only)
router.post('/:id/lock', lockMarksheet);

// Unlock marksheet (admin/principal only)
router.post('/:id/unlock', unlockMarksheet);

// Publish marksheet (admin/principal only)
router.post('/:id/publish', publishMarksheet);

module.exports = router;
