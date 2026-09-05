const { body } = require('express-validator');
const Project = require('../models/Project');

const createProjectValidator = [
  body('service').isUUID().withMessage('Valid service is required'),
  body('package').isUUID().withMessage('Valid package is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('requirements').optional().trim().isLength({ max: 5000 }),
];

const updateStatusValidator = [
  body('status')
    .isIn(Project.STATUSES)
    .withMessage(`Status must be one of: ${Project.STATUSES.join(', ')}`),
];

module.exports = { createProjectValidator, updateStatusValidator };
