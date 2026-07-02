const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');

router.get('/health', healthController.health);

// Auth routes
router.use('/auth', require('./auth'));

// Dashboard analytics (admin)
router.use('/dashboard', require('./dashboard'));

// User management (admin)
router.use('/users', require('./users'));

// Department management (admin)
router.use('/departments', require('./departments'));

// Directory lookups (non-admin safe)
router.use('/directory', require('./directory'));

// Attendance management
router.use('/attendance', require('./attendance'));

// Staff/Teacher attendance management
router.use('/staff-attendance', require('./staffAttendance'));

// Student management (parent linking, bulk import)
router.use('/students', require('./students'));

// Parent management
router.use('/parents', require('./parents'));

// Classes/Grades management (Admin)
router.use('/classes', require('./classes'));

// Syllabus management (Admin/Principal)
router.use('/syllabus', require('./syllabus'));

// Inventory management (Admin)
router.use('/inventory', require('./inventory'));

// Library management
router.use('/library', require('./library'));

// Hostel management
router.use('/hostel', require('./hostel'));

// Subjects management (read for all roles, write Admin-only)
router.use('/subjects', require('./subjects'));

// HR teacher management (teacher-only)
router.use('/hr/teachers', require('./hrTeachers'));

// Admin teacher management
router.use('/teachers', require('./teachers'));

// Report cards
router.use('/reports', require('./reportCards'));

// Exams + exam configuration
router.use('/exams', require('./exams'));

// Marksheets management
router.use('/marksheets', require('./marksheets'));

// Grade scales (global grading configuration)
router.use('/grade-scales', require('./gradeScales'));

// Timetable management
router.use('/timetables', require('./timetables'));

// Homework management
router.use('/homeworks', require('./homeworks'));

// Daily diary management
router.use('/daily-diary', require('./dailyDiary'));

// Fee management
router.use('/fees', require('./fees'));

// Finance management
router.use('/finance', require('./finance'));

// Transport management
router.use('/transport', require('./transport'));

// Salary management
router.use('/salary', require('./salary'));

// Complaints & feedback
router.use('/complaints', require('./complaints'));
router.use('/complaint-categories', require('./complaintCategories'));

// Real-time messaging
router.use('/messages', require('./messaging'));

// FCM push token management
router.use('/fcm', require('./fcm'));

// In-app notifications + requests
router.use('/notifications', require('./notifications'));

// AI Chat agent
router.use('/chat', require('./chat'));

// Async exports (PDF, ZIP, etc.)
router.use('/exports', require('./exports'));

// Student certificates
router.use('/certificates', require('./certificates'));

module.exports = router;
