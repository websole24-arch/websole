const { body } = require('express-validator');

// `href` intentionally isn't checked with isURL() — it's just as often an
// internal path like "/tools" as a full external URL, and isURL() rejects
// relative paths.
const createFreeToolValidator = [
  body('label').trim().notEmpty().withMessage('Label is required').isLength({ max: 100 }),
  body('href').trim().notEmpty().withMessage('Link is required').isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
  body('order').optional().isInt().withMessage('Order must be a whole number'),
];

const updateFreeToolValidator = [
  body('label').optional().trim().notEmpty().isLength({ max: 100 }),
  body('href').optional().trim().notEmpty().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
  body('order').optional().isInt().withMessage('Order must be a whole number'),
];

module.exports = { createFreeToolValidator, updateFreeToolValidator };
