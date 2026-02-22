const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');

router.get('/health', healthController.health);

// Auth routes
router.use('/auth', require('./auth'));

// User management (admin)
router.use('/users', require('./users'));

// Directory lookups (non-admin safe)
router.use('/directory', require('./directory'));

// Attendance management
router.use('/attendance', require('./attendance'));

// Staff/Teacher attendance management
router.use('/staff-attendance', require('./staffAttendance'));

// Student management (parent linking, bulk import)
router.use('/students', require('./students'));

// Classes/Grades management (Admin)
router.use('/classes', require('./classes'));

// Subjects management (read for all roles, write Admin-only)
router.use('/subjects', require('./subjects'));

// HR teacher management (teacher-only)
router.use('/hr/teachers', require('./hrTeachers'));

// Report cards
router.use('/reports', require('./reportCards'));

// Timetable management
router.use('/timetables', require('./timetables'));

// Homework management
router.use('/homeworks', require('./homeworks'));

// Fee management
router.use('/fees', require('./fees'));

// Complaints & feedback
router.use('/complaints', require('./complaints'));

// Real-time messaging
router.use('/messages', require('./messaging'));

// FCM push token management
router.use('/fcm', require('./fcm'));

// In-app notifications + requests
router.use('/notifications', require('./notifications'));

// AI Chat agent
router.use('/chat', require('./chat'));

module.exports = router;
