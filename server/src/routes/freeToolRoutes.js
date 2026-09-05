const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createFreeToolValidator, updateFreeToolValidator } = require('../validators/freeToolValidators');
const {
  listFreeTools, listFreeToolsAdmin, createFreeTool, updateFreeTool, deleteFreeTool,
} = require('../controllers/freeToolController');

const router = express.Router();

router.get('/', listFreeTools);
// Two path segments, so this never collides with any future GET /:id route.
router.get('/admin/all', protect, authorize('admin'), listFreeToolsAdmin);
router.post('/', protect, authorize('admin'), createFreeToolValidator, validate, createFreeTool);
router.patch('/:id', protect, authorize('admin'), updateFreeToolValidator, validate, updateFreeTool);
router.delete('/:id', protect, authorize('admin'), deleteFreeTool);

module.exports = router;
