const { body } = require('express-validator');

const createReviewValidator = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5 stars'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review must be between 10 and 1000 characters'),
  body('service').optional().trim().isLength({ max: 100 }),
];

const setApprovalValidator = [
  body('approved').isBoolean().withMessage('approved must be true or false'),
];

module.exports = { createReviewValidator, setApprovalValidator };
