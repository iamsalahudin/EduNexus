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

// Mark (self) or (admin/hr/principal) can mark others via userId
router.post(
  '/',
  requireRole('Teacher', 'Admin', 'HR', 'Principal'),
  validate(markStaffAttendanceSchema),
  staffAttendanceController.markStaffAttendance
);

// View: admin/hr/principal can view all; others self-only
router.get(
  '/',
  requireRole('Teacher', 'Admin', 'HR', 'Principal'),
  validate(getStaffAttendanceSchema),
  staffAttendanceController.getStaffAttendance
);

router.get(
  '/summary',
  requireRole('Teacher', 'Admin', 'HR', 'Principal'),
  staffAttendanceController.getStaffAttendanceSummary
);

router.patch(
  '/:id',
  requireRole('Teacher', 'Admin', 'HR', 'Principal'),
  validate(updateStaffAttendanceSchema),
  staffAttendanceController.updateStaffAttendance
);

router.delete(
  '/:id',
  requireRole('Admin', 'HR'),
  staffAttendanceController.deleteStaffAttendance
);

module.exports = router;
