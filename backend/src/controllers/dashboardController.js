const dashboardService = require('../services/dashboardService');

async function getSummary(req, res, next) {
  try {
    const data = await dashboardService.getDashboardSummary();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getAttendanceToday(req, res, next) {
  try {
    const data = await dashboardService.getAttendanceToday();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getFinanceOverview(req, res, next) {
  try {
    const data = await dashboardService.getFinanceOverview();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getClassStrength(req, res, next) {
  try {
    const data = await dashboardService.getClassStrength();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getRecentActivities(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || 10, 10);
    const data = await dashboardService.getRecentActivities(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getNotifications(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || 20, 10);
    const data = await dashboardService.getDashboardNotifications(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getAttendanceToday,
  getFinanceOverview,
  getClassStrength,
  getRecentActivities,
  getNotifications
};
