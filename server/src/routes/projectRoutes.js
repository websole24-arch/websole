const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createProjectValidator,
  updateStatusValidator,
} = require('../validators/projectValidators');
const {
  createProject, listProjects, getProject, updateProjectStatus,
} = require('../controllers/projectController');

const router = express.Router();

router.post('/', protect, authorize('customer'), createProjectValidator, validate, createProject);
router.get('/', protect, listProjects);
router.get('/:id', protect, getProject);
router.patch(
  '/:id/status',
  protect,
  authorize('admin'),
  updateStatusValidator,
  validate,
  updateProjectStatus
);

module.exports = router;
