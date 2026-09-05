const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createServiceValidator, updateServiceValidator } = require('../validators/serviceValidators');
const {
  listServices, getService, listServicesAdmin, createService, updateService, deleteService,
} = require('../controllers/serviceController');

const router = express.Router();

router.get('/', listServices);
// Two path segments, so this never collides with GET /:slug below.
router.get('/admin/all', protect, authorize('admin'), listServicesAdmin);
router.get('/:slug', getService);
router.post('/', protect, authorize('admin'), createServiceValidator, validate, createService);
router.put('/:id', protect, authorize('admin'), updateServiceValidator, validate, updateService);
router.delete('/:id', protect, authorize('admin'), deleteService);

module.exports = router;
