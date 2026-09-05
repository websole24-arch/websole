const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReviewValidator, setApprovalValidator } = require('../validators/reviewValidators');
const {
  listPublicReviews, createReview, getMyReview, listAllAdmin, setApproval, deleteReview,
} = require('../controllers/reviewController');

const router = express.Router();

router.get('/', listPublicReviews);
router.get('/me', protect, getMyReview);
router.get('/admin/all', protect, authorize('admin'), listAllAdmin);
router.post('/', protect, createReviewValidator, validate, createReview);
router.patch('/:id', protect, authorize('admin'), setApprovalValidator, validate, setApproval);
router.delete('/:id', protect, authorize('admin'), deleteReview);

module.exports = router;
