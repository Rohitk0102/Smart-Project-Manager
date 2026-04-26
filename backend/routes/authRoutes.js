const express = require('express');
const router = express.Router();
const { syncCurrentUser, getUserProfile, getAllUsers, inviteUser, checkInvite, claimCto, searchUsers, updateTechRole } = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Public route
router.get('/check-invite', checkInvite);

// Protected routes
router.post('/sync', protect, syncCurrentUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, getAllUsers);
router.post('/claim-cto', protect, claimCto);
router.get('/search', protect, searchUsers);
router.put('/profile/tech-role', protect, updateTechRole);

// Restricted routes
router.post('/invite', protect, requireRole('CTO', 'PM'), inviteUser);

module.exports = router;