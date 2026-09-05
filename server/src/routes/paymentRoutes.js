const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createCheckoutSession, verifySession, listForProject,
} = require('../controllers/paymentController');

const router = express.Router();

// Note: POST /webhook is NOT here — Stripe's signature check needs the
// raw request body, which must be read before express.json() runs. It's
// mounted directly in app.js instead. See that file for why.

router.post('/checkout', protect, authorize('customer'), createCheckoutSession);
router.get('/verify/:sessionId', protect, verifySession);
router.get('/project/:projectId', protect, listForProject);

module.exports = router;
