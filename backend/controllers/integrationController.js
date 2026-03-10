const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');
require('dotenv').config();

const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const backendUrl = process.env.API_BASE_URL || 'http://localhost:5005';
const googleCallbackUrl = `${backendUrl}/api/integrations/google-calendar/callback`;

const getOAuth2Client = () => new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || '',
    process.env.GOOGLE_CLIENT_SECRET || '',
    googleCallbackUrl
);

const signGoogleState = (payload) => {
    const secret = process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.CLERK_SECRET_KEY || 'clerk-google-state-dev-secret';
    return jwt.sign(payload, secret, { expiresIn: '10m' });
};

const verifyGoogleState = (state) => {
    const secret = process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.CLERK_SECRET_KEY || 'clerk-google-state-dev-secret';
    return jwt.verify(state, secret);
};

const sanitizeRedirectPath = (path) => {
    if (!path || typeof path !== 'string' || !path.startsWith('/')) {
        return '/calendar';
    }

    if (path.startsWith('//')) {
        return '/calendar';
    }

    return path;
};

// @desc    Handle Slack Webhook
// @route   POST /api/integrations/slack
// @access  Public (Webhook)
const handleSlackWebhook = async (req, res) => {
    const { event } = req.body;

    if (event && event.type === 'message') {
        console.log('Received Slack Message:', event.text);
    }

    return res.status(200).send('OK');
};

// @desc    Start Google Calendar OAuth connection
// @route   POST /api/integrations/google-calendar/connect-url
// @access  Private
const getGoogleCalendarConnectUrl = async (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(500).json({ message: 'Google Calendar integration is not configured on the backend' });
    }

    const redirectPath = sanitizeRedirectPath(req.body?.redirectPath);
    const oauth2Client = getOAuth2Client();
    const state = signGoogleState({
        userId: req.user._id.toString(),
        redirectPath,
    });

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/calendar.events',
        ],
        state,
    });

    return res.json({ url });
};

// @desc    Finish Google Calendar OAuth connection
// @route   GET /api/integrations/google-calendar/callback
// @access  Public
const handleGoogleCalendarCallback = async (req, res) => {
    const fallbackRedirect = `${frontendUrl}/calendar?google=error`;

    try {
        const { code, state } = req.query;

        if (!code || !state) {
            return res.redirect(fallbackRedirect);
        }

        const decoded = verifyGoogleState(state);
        const redirectPath = sanitizeRedirectPath(decoded.redirectPath);
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const googleProfile = await oauth2.userinfo.get();

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.redirect(fallbackRedirect);
        }

        user.googleId = googleProfile.data.id || user.googleId;
        user.googleAccessToken = tokens.access_token || user.googleAccessToken;
        user.googleRefreshToken = tokens.refresh_token || user.googleRefreshToken;
        await user.save();

        return res.redirect(`${frontendUrl}${redirectPath}?google=connected`);
    } catch (error) {
        console.error('Google Calendar callback failed', error);
        return res.redirect(fallbackRedirect);
    }
};

// @desc    Get Google Calendar Events
// @route   GET /api/integrations/google-calendar/events
// @access  Private
const getGoogleCalendarEvents = async (req, res) => {
    try {
        const user = req.user;

        if (!user.googleAccessToken && !user.googleRefreshToken) {
            return res.status(400).json({ message: 'Google account not connected' });
        }

        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
        });

        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                user.googleAccessToken = tokens.access_token;
            }

            if (tokens.refresh_token) {
                user.googleRefreshToken = tokens.refresh_token;
            }

            await user.save();
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return res.json(response.data.items);
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);

        if (error.code === 401) {
            return res.status(401).json({ message: 'Google token expired or invalid' });
        }

        return res.status(500).json({ message: 'Failed to fetch Google Calendar events' });
    }
};

// @desc    Sync Google Calendar (Placeholder for manual sync trigger)
// @route   POST /api/integrations/google-calendar
// @access  Private
const syncGoogleCalendar = async (req, res) => {
    return res.json({ message: 'Calendar sync initiated' });
};

module.exports = {
    getGoogleCalendarConnectUrl,
    handleGoogleCalendarCallback,
    handleSlackWebhook,
    syncGoogleCalendar,
    getGoogleCalendarEvents,
};
