const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  uploadMiddleware, uploadFile, listFiles, downloadFile, deleteFile,
} = require('../controllers/fileController');

const router = express.Router();

router.post('/:id/files', protect, uploadMiddleware, uploadFile);
router.get('/:id/files', protect, listFiles);
router.get('/:id/files/:fileId/download', protect, downloadFile);
router.delete('/:id/files/:fileId', protect, authorize('admin'), deleteFile);

module.exports = router;
