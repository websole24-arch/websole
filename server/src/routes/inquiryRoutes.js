const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { formLimiter } = require('../middleware/rateLimiter');
const { createInquiryValidator } = require('../validators/inquiryValidators');
const { createInquiry, listInquiries, viewInquiry } = require('../controllers/inquiryController');

const router = express.Router();

router.post('/', formLimiter, createInquiryValidator, validate, createInquiry);
router.get('/', protect, authorize('admin'), listInquiries);
router.patch('/:id/view', protect, authorize('admin'), viewInquiry);

module.exports = router;
