const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPricingValidator, updatePricingValidator } = require('../validators/pricingValidators');
const {
  getPricing, listCountries, listPricingAdmin, createPricing, updatePricing, deletePricing,
} = require('../controllers/pricingController');

const router = express.Router();

router.get('/', getPricing);
router.get('/countries', listCountries);
router.get('/admin/all', protect, authorize('admin'), listPricingAdmin);
router.post('/', protect, authorize('admin'), createPricingValidator, validate, createPricing);
router.put('/:id', protect, authorize('admin'), updatePricingValidator, validate, updatePricing);
router.delete('/:id', protect, authorize('admin'), deletePricing);

module.exports = router;
