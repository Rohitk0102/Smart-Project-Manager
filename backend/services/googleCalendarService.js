const { google } = require('googleapis');
const User = require('../models/User');
require('dotenv').config();

const backendUrl = process.env.API_BASE_URL || 'http://localhost:5005';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || "",
    process.env.GOOGLE_CLIENT_SECRET || "",
    `${backendUrl}/api/integrations/google-calendar/callback`
);

const addToGoogleCalendar = async (userId, task) => {
    try {
        const user = await User.findById(userId);

        if (!user || !user.googleRefreshToken) {
            return null; // Not connected to Google or strictly manual signup
        }

        oauth2Client.setCredentials({
            refresh_token: user.googleRefreshToken
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const startTime = new Date(task.dueDate);
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1);

        const event = {
            summary: `Task: ${task.title}`,
            description: task.description || '',
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'UTC',
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        console.log('Google Calendar Event Created:', response.data.htmlLink);
        return response.data;

    } catch (error) {
        console.error('Error adding to Google Calendar:', error.message);
        return null;
    }
};

module.exports = { addToGoogleCalendar };
