require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5005;
const server = http.createServer(app);

console.log('Starting server...');

// Initialize Socket.io
initSocket(server);

console.log('Attempting to connect to database...');
// Connect to Database and start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
});
