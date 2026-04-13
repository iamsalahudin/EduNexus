const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createTimetableSchema, updateTimetableSchema, getTimetablesSchema } = require('../validators/timetables');

// All routes require auth
router.use(requireAuth);

// Admin/Principal: Create timetable
router.post('/', requireRole('Admin', 'Principal'), validate(createTimetableSchema), timetableController.createTimetable);

// All authenticated users: Get timetables
router.get('/', validate(getTimetablesSchema), timetableController.getTimetables);

// All authenticated users: Get single timetable
router.get('/:id', timetableController.getTimetable);

// Admin/Principal/Reception: Update timetable
router.patch('/:id', requireRole('Admin', 'Principal', 'Reception'), validate(updateTimetableSchema), timetableController.updateTimetable);

// Admin/Principal: Delete timetable
router.delete('/:id', requireRole('Admin', 'Principal'), timetableController.deleteTimetable);

module.exports = router;
