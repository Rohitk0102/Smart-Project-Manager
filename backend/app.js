const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { clerkMiddleware } = require('@clerk/express');
require('dotenv').config();

const app = express();

if (!process.env.CLERK_SECRET_KEY) {
    console.warn('CLERK_SECRET_KEY is not set. Clerk-authenticated API routes will return setup errors until it is configured.');
}

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.set('trust proxy', 1); // Trust Render/Heroku proxy for HTTPS
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/integrations', require('./routes/integrationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

module.exports = app;
