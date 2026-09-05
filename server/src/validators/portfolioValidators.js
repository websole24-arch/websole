const { body } = require('express-validator');

const createPortfolioValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }),
  body('service').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('country').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('imageUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('Image URL must be a valid URL'),
  body('projectUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('Project URL must be a valid URL'),
  body('completedOn').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date'),
  body('published').optional().isBoolean(),
  body('techStack').optional().isArray({ max: 12 }).withMessage('Tech stack must be a list'),
  body('techStack.*').optional().trim().isLength({ max: 40 }),
  body('features').optional().isArray({ max: 12 }).withMessage('Features must be a list'),
  body('features.*').optional().trim().isLength({ max: 200 }),
];

const updatePortfolioValidator = [
  body('title').optional().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional().trim().notEmpty().isLength({ max: 2000 }),
  body('service').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('country').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('imageUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('Image URL must be a valid URL'),
  body('projectUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('Project URL must be a valid URL'),
  body('completedOn').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date'),
  body('published').optional().isBoolean(),
  body('techStack').optional().isArray({ max: 12 }).withMessage('Tech stack must be a list'),
  body('techStack.*').optional().trim().isLength({ max: 40 }),
  body('features').optional().isArray({ max: 12 }).withMessage('Features must be a list'),
  body('features.*').optional().trim().isLength({ max: 200 }),
];

module.exports = { createPortfolioValidator, updatePortfolioValidator };
