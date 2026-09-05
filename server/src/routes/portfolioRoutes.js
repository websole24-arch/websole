const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPortfolioValidator, updatePortfolioValidator } = require('../validators/portfolioValidators');
const {
  listPublished, listAllAdmin, createProject, updateProject, deleteProject,
  uploadImageMiddleware, uploadImage,
} = require('../controllers/portfolioController');

const router = express.Router();

router.get('/', listPublished);
router.get('/admin/all', protect, authorize('admin'), listAllAdmin);
router.post('/admin/upload-image', protect, authorize('admin'), uploadImageMiddleware, uploadImage);
router.post('/', protect, authorize('admin'), createPortfolioValidator, validate, createProject);
router.patch('/:id', protect, authorize('admin'), updatePortfolioValidator, validate, updateProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);

module.exports = router;
