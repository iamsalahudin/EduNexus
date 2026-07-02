const express = require('express');
const router = express.Router();

const staffAttendanceController = require('../controllers/staffAttendanceController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  markStaffAttendanceSchema,
  getStaffAttendanceSchema,
  updateStaffAttendanceSchema
} = require('../validators/staffAttendance');

router.use(requireAuth);

// Mark daily attendance (admin/principal/reception)
router.post(
  '/',
  requireRole('Admin', 'Principal', 'Receptionist'),
  validate(markStaffAttendanceSchema),
  staffAttendanceController.markStaffAttendance
);

// View: admin/hr/principal can view all; others self-only
router.get(
  '/',
  requireRole('Teacher', 'Admin', 'HR', 'Principal', 'Receptionist'),
  validate(getStaffAttendanceSchema),
  staffAttendanceController.getStaffAttendance
);

// Export: admin/hr/principal only
router.get(
  '/export',
  requireRole('Admin', 'HR', 'Principal', 'Receptionist'),
  staffAttendanceController.exportStaffAttendance
);

router.get(
  '/summary',
  requireRole('Teacher', 'Admin', 'HR', 'Principal', 'Receptionist'),
  staffAttendanceController.getStaffAttendanceSummary
);

router.patch(
  '/:id',
  requireRole('Admin', 'Principal'),
  validate(updateStaffAttendanceSchema),
  staffAttendanceController.updateStaffAttendance
);

router.delete(
  '/:id',
  requireRole('Admin', 'HR'),
  staffAttendanceController.deleteStaffAttendance
);

module.exports = router;
