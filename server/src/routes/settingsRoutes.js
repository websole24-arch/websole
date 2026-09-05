const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateSettingsValidator } = require('../validators/settingsValidators');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/', getSettings);
router.patch('/', protect, authorize('admin'), updateSettingsValidator, validate, updateSettings);

module.exports = router;
