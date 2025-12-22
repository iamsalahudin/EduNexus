const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController');

router.get('/health', healthController.health);

// Auth routes
router.use('/auth', require('./auth'));

// User management (admin)
router.use('/users', require('./users'));

// Mount other routers here (users, students, attendance, reports...)

module.exports = router;
