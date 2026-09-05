const { body } = require('express-validator');

const createPackageValidator = [
  body('service').trim().notEmpty().withMessage('service is required'),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 3000 }),
  body('features').optional().isArray({ max: 30 }).withMessage('Features must be a list'),
  body('features.*').optional().trim().isLength({ max: 300 }),
  body('isActive').optional().isBoolean(),
  body('order').optional().isInt().withMessage('Order must be a whole number'),
];

const updatePackageValidator = [
  body('service').optional().trim().notEmpty(),
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 3000 }),
  body('features').optional().isArray({ max: 30 }).withMessage('Features must be a list'),
  body('features.*').optional().trim().isLength({ max: 300 }),
  body('isActive').optional().isBoolean(),
  body('order').optional().isInt().withMessage('Order must be a whole number'),
];

module.exports = { createPackageValidator, updatePackageValidator };
