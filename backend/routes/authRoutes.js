const express = require('express');
const router = express.Router();
const { syncCurrentUser, getUserProfile, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/sync', protect, syncCurrentUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, getAllUsers);

module.exports = router;
