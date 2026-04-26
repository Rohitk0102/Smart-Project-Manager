const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, handleChat);

module.exports = router;