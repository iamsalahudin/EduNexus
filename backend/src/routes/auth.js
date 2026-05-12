const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema, refreshSchema, logoutSchema, changePasswordSchema, sendOtpSchema, verifyOtpSchema, resetPasswordSchema } = require('../validators/auth');

// Register: restricted to authenticated admin by default. Bootstrapping handled via seed script.
router.post('/register', requireAuth, validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);
router.post('/change-password', requireAuth, validate(changePasswordSchema), authController.changePassword);

// Password reset / OTP flow
router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Return current user from access token
router.get('/me', requireAuth, (req, res) => {
	res.json({ user: req.user });
});

module.exports = router;
