const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { markAttendanceSchema, getAttendanceSchema, updateAttendanceSchema } = require('../validators/attendance');

// All routes require auth
router.use(requireAuth);

// Mark attendance: teachers only
router.post('/', requireRole('Teacher'), validate(markAttendanceSchema), attendanceController.markAttendance);

// View attendance: all roles
router.get('/', validate(getAttendanceSchema), attendanceController.getAttendance);

// Summary/statistics: admin, principal, hr, teacher
router.get('/summary', requireRole('Admin', 'Principal', 'HR', 'Teacher'), attendanceController.getAttendanceSummary);

// Update attendance: teachers + admin
router.patch('/:id', requireRole('Teacher', 'Admin'), validate(updateAttendanceSchema), attendanceController.updateAttendance);

module.exports = router;
