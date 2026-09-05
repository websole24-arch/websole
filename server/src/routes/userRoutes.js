const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { listUsers, updateUser } = require('../controllers/userController');

const router = express.Router();

router.get('/', protect, authorize('admin'), listUsers);
router.patch('/:id', protect, authorize('admin'), updateUser);

module.exports = router;
