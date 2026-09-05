const { body } = require('express-validator');

const createInquiryValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('whatsapp').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('country').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('service').trim().notEmpty().withMessage('Please select a service'),
  body('budget').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('description')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Please describe your project in at least 20 characters'),
  body('referenceWebsite')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Reference website must be a valid URL'),
  body('preferredDeadline').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date'),
];

module.exports = { createInquiryValidator };
