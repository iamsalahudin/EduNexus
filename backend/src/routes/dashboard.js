const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/summary', requireAuth, dashboardController.getSummary);
router.get('/attendance-today', requireAuth, dashboardController.getAttendanceToday);
router.get('/finance-overview', requireAuth, dashboardController.getFinanceOverview);
router.get('/class-strength', requireAuth, dashboardController.getClassStrength);
router.get('/recent-activities', requireAuth, dashboardController.getRecentActivities);
router.get('/notifications', requireAuth, dashboardController.getNotifications);

module.exports = router;
