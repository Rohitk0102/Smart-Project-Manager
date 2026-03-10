const express = require('express');
const router = express.Router();
const {
    getGoogleCalendarConnectUrl,
    handleGoogleCalendarCallback,
    handleSlackWebhook,
    syncGoogleCalendar,
    getGoogleCalendarEvents
} = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/slack', handleSlackWebhook);
router.post('/google-calendar', protect, syncGoogleCalendar);
router.post('/google-calendar/connect-url', protect, getGoogleCalendarConnectUrl);
router.get('/google-calendar/callback', handleGoogleCalendarCallback);
router.get('/google-calendar/events', protect, getGoogleCalendarEvents);

module.exports = router;
