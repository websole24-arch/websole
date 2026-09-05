const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  body('phone').optional().trim(),
  body('country').optional().trim(),
  body('companyName').optional().trim(),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const magicLinkValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const verifyEmailValidator = [
  body('access_token').notEmpty().withMessage('access_token is required'),
  body('refresh_token').notEmpty().withMessage('refresh_token is required'),
];

const resendVerificationValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  body('access_token').notEmpty().withMessage('access_token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
];

module.exports = {
  registerValidator,
  loginValidator,
  magicLinkValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};

