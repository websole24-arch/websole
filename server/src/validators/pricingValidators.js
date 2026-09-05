const { body } = require('express-validator');

const createPricingValidator = [
  body('country').trim().notEmpty().withMessage('Country is required').isLength({ max: 100 }),
  body('countryCode').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 letters'),
  body('currency').trim().notEmpty().withMessage('Currency is required').isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('service').trim().notEmpty().withMessage('service is required'),
  body('package').trim().notEmpty().withMessage('package is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('active').optional().isBoolean(),
];

const updatePricingValidator = [
  body('country').optional().trim().notEmpty().isLength({ max: 100 }),
  body('countryCode').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 letters'),
  body('currency').optional().trim().notEmpty().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('service').optional().trim().notEmpty(),
  body('package').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('active').optional().isBoolean(),
];

module.exports = { createPricingValidator, updatePricingValidator };
