const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPackageValidator, updatePackageValidator } = require('../validators/packageValidators');
const {
  listPackages, listPackagesAdmin, createPackage, updatePackage, deletePackage,
} = require('../controllers/packageController');

const router = express.Router();

router.get('/', listPackages);
router.get('/admin/all', protect, authorize('admin'), listPackagesAdmin);
router.post('/', protect, authorize('admin'), createPackageValidator, validate, createPackage);
router.put('/:id', protect, authorize('admin'), updatePackageValidator, validate, updatePackage);
router.delete('/:id', protect, authorize('admin'), deletePackage);

module.exports = router;
