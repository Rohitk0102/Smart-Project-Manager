const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const passport = require('passport');
require('./config/passport'); // Passport config

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(require('morgan')('dev'));
}

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/integrations', require('./routes/integrationRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

module.exports = app;
