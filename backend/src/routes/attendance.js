const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { markAttendanceSchema, getAttendanceSchema, updateAttendanceSchema, attendanceAssignmentSchema, createLeaveRequestSchema, editLeaveRequestSchema, getLeaveRequestsSchema } = require('../validators/attendance');

// All routes require auth
router.use(requireAuth);

// Mark student attendance: class teacher + admin/principal
router.post('/', requireRole('Teacher', 'Admin', 'Principal'), validate(markAttendanceSchema), attendanceController.markAttendance);

// View attendance: all roles
router.get('/', validate(getAttendanceSchema), attendanceController.getAttendance);

// Export attendance with role-scoped data
router.get('/export', requireRole('Admin', 'Principal', 'HR', 'Teacher', 'Receptionist', 'Student', 'Parent'), attendanceController.exportAttendance);

// Summary/statistics with role-scoped data
router.get('/summary', requireRole('Admin', 'Principal', 'HR', 'Teacher', 'Receptionist', 'Student', 'Parent'), attendanceController.getAttendanceSummary);
router.get('/reports', requireRole('Admin', 'Principal', 'HR', 'Teacher', 'Receptionist'), attendanceController.getAttendanceReport);
router.get('/class-overview', requireRole('Admin', 'Principal', 'HR', 'Teacher', 'Receptionist'), attendanceController.getClassAttendanceOverview);

// Update attendance: teacher scoped + admin/principal
router.patch('/:id', requireRole('Teacher', 'Admin', 'Principal'), validate(updateAttendanceSchema), attendanceController.updateAttendance);

// Attendance setup assignments: admin/principal
router.get('/setup/assignments', requireRole('Admin', 'Principal'), attendanceController.listAttendanceAssignments);
router.post('/setup/assignments', requireRole('Admin', 'Principal'), validate(attendanceAssignmentSchema), attendanceController.saveAttendanceAssignment);
router.put('/setup/assignments/:id', requireRole('Admin', 'Principal'), validate(attendanceAssignmentSchema), attendanceController.saveAttendanceAssignment);
router.delete('/setup/assignments/:id', requireRole('Admin', 'Principal'), attendanceController.deleteAttendanceAssignment);

// Delete attendance: admin only
router.delete('/:id', requireRole('Admin'), attendanceController.deleteAttendance);

// Leave requests
router.post('/leave-requests', validate(createLeaveRequestSchema), attendanceController.createLeaveRequest);
router.get('/leave-requests', validate(getLeaveRequestsSchema), attendanceController.getLeaveRequests);
router.patch('/leave-requests/:id', validate(editLeaveRequestSchema), attendanceController.editLeaveRequest);

module.exports = router;
