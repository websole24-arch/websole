const { body } = require('express-validator');

const createServiceValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ max: 150 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug may only contain lowercase letters, numbers, and hyphens'),
  body('shortDescription').trim().notEmpty().withMessage('Short description is required').isLength({ max: 300 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 5000 }),
  body('examples').optional().isArray({ max: 20 }).withMessage('Examples must be a list'),
  body('examples.*').optional().trim().isLength({ max: 150 }),
  body('icon').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('isActive').optional().isBoolean(),
  body('order').optional().isInt().withMessage('Order must be a whole number'),
];

const updateServiceValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('slug')
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 150 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug may only contain lowercase letters, numbers, and hyphens'),
  body('shortDescription').optional().trim().notEmpty().isLength({ max: 300 }),
  body('description').optional().trim().notEmpty().isLength({ max: 5000 }),
  body('examples').optional().isArray({ max: 20 }).withMessage('Examples must be a list'),
  body('examples.*').optional().trim().isLength({ max: 150 }),
  body('icon').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('isActive').optional().isBoolean(),
  body('order').optional().isInt().withMessage('Order must be a whole number'),
];

module.exports = { createServiceValidator, updateServiceValidator };
