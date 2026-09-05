const express = require('express');
const {
  register,
  login,
  sendMagicLink,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');
const {
  registerValidator,
  loginValidator,
  magicLinkValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidators');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect, attachUserIfPresent } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/magic-link', authLimiter, magicLinkValidator, validate, sendMagicLink);
router.post('/verify', authLimiter, verifyEmailValidator, validate, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationValidator, validate, resendVerification);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, resetPassword);
router.post('/logout', protect, logout);
// attachUserIfPresent, not protect: "am I logged in?" should answer 200
// with { user: null } when nobody is, not 401 — see auth.js middleware.
router.get('/me', attachUserIfPresent, getMe);

module.exports = router;

