const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const logger = require('../utils/logger');
const { registerSchema, loginSchema, refreshSchema, logoutSchema, changePasswordSchema, sendOtpSchema, verifyOtpSchema, resetPasswordSchema, updateProfileSchema } = require('../validators/auth');

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res, _next, options) => {
		logger.warn('Auth rate limit hit for %s %s from %s', req.method, req.originalUrl, req.ip)
		res.status(options.statusCode).json({
			error: 'Too many authentication requests. Please try again later.'
		})
	}
});

// Register: restricted to authenticated admin by default. Bootstrapping handled via seed script.
router.post('/register', requireAuth, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', authLimiter, validate(logoutSchema), authController.logout);
router.post('/change-password', requireAuth, authLimiter, validate(changePasswordSchema), authController.changePassword);

// Password reset / OTP flow
router.post('/send-otp', authLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Return current user from access token
router.get('/me', requireAuth, (req, res) => {
	res.json({ user: req.user });
});
// Update profile (students can update name, email, phone)
router.patch('/profile', requireAuth, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
