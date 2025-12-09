const express = require('express');
const router = express.Router();
const { handleSlackWebhook, syncGoogleCalendar } = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/slack', handleSlackWebhook);
router.post('/google-calendar', protect, syncGoogleCalendar);

module.exports = router;
