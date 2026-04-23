const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Import Feature Logic (New Easy Structure)
dotenv.config();
const { connectDB } = require('./common-helpers/database-schemas');

// Login Flow
const setupAuthLogin = require('./login-feature/auth-login');
const setupForgotPassword = require('./login-feature/forgot-password');
const setupAppInstall = require('./login-feature/app-install-logic');

// Admin Dashboard Flow
const setupManageUsers = require('./admin-feature/manage-users');
const setupViewLogs = require('./admin-feature/view-activity-logs');
const setupNotifications = require('./admin-feature/notification-manager');

const app = express();
app.use(express.json());

// CORS setup
const allowedOrigins = [
    'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000',
    'https://loginsystem-9sss.vercel.app', 'https://loginsystem-teal-rho.vercel.app'
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) callback(null, true);
        else callback(new Error('CORS Error'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }
});

// Socket.io for Real-time Admin Monitoring
io.on('connection', (socket) => {
    socket.on('join-admin-room', (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === 'admin') socket.join('admins');
        } catch (err) {}
    });
});

// Connect Database
connectDB();

// Main Routes (Matching Easy Structure Flow)
app.get('/', (req, res) => res.json({ status: 'Running' }));
app.use('/api', setupAuthLogin(io));
app.use('/api', setupForgotPassword());
app.use('/api', setupAppInstall());
app.use('/api', setupManageUsers(io));
app.use('/api', setupViewLogs(io));
app.use('/api', setupNotifications());

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));

module.exports = app;
