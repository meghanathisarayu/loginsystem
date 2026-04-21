const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const emailjs = require('@emailjs/nodejs');
const bcrypt = require('bcryptjs');

const connectDB = require('./models');
const User = require('./models/User');
const ActivityLog = require('./models/ActivityLog');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Connect to MongoDB
connectDB();

// Temporary store for OTPs
let otpStore = {};

// Temporary store for login attempts
let loginAttempts = {};

// Activity Log Helper Function
async function logActivity(userId, userName, userEmail, action, details = '') {
    try {
        const log = await ActivityLog.create({
            userId,
            userName,
            userEmail,
            action,
            details
        });

        // Emit the log to all connected clients
        console.log('--- SOCKET EMITTING ACTIVITY ---', log.action, log.userName);
        io.emit('new-activity', log);
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}

// EmailJS initial configuration
emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Login API
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Initialize or get attempts for this email
    if (!loginAttempts[email]) {
        loginAttempts[email] = { count: 0, lockUntil: 0 };
    }

    const now = Date.now();
    const attempts = loginAttempts[email];

    // Check if account is currently locked
    if (attempts.lockUntil > now) {
        const remainingTime = Math.ceil((attempts.lockUntil - now) / 1000);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        return res.status(403).json({
            message: `Account locked. Please try again in ${minutes}m ${seconds}s.`
        });
    }

    try {
        const user = await User.findOne({ email });

        if (user) {
            // Compare hashed password
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                // SUCCESS: Reset attempts on successful login
                loginAttempts[email] = { count: 0, lockUntil: 0 };

                const token = jwt.sign(
                    { id: user._id, role: user.role, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                // Log successful login
                logActivity(user._id, user.name, user.email, 'LOGIN', 'User logged in successfully');

                res.status(200).json({
                    message: 'Login successful',
                    token: token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            } else {
                // WRONG PASSWORD
                attempts.count += 1;

                if (attempts.count >= 4) {
                    attempts.lockUntil = now + 120000; // Lock for 2 minutes
                    attempts.count = 0;
                    return res.status(403).json({
                        message: 'Too many failed attempts. Account locked for 2 minutes.'
                    });
                }

                res.status(401).json({
                    message: `Invalid password. ${4 - attempts.count} attempts remaining.`
                });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
});

// --- Forgot Password Flow ---

// 1. Request OTP
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No user found with this email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, expires: Date.now() + 600000 }; // 10 mins expiry

        const templateParams = {
            to_email: email,
            otp: otp,
            reply_to: 'support@yourdomain.com'
        };

        emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            templateParams,
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY,
            }
        ).then(() => {
            res.status(200).json({ message: 'OTP sent to your email successfully via EmailJS' });
        }).catch((err) => {
            console.error('EmailJS Error:', err);
            // Fallback: return OTP in message if EmailJS fails (for testing)
            res.status(200).json({
                message: `[DEBUG] EmailJS failed (${err.text || err.message}). Your OTP is: ${otp}`,
                otp: otp
            });
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// 2. Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const stored = otpStore[email];

    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP verified' });
});

// 3. Reset Password
app.post('/api/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const stored = otpStore[email];

    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
        return res.status(400).json({ message: 'Action expired. Please start over.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ email }, { password: hashedPassword });
        delete otpStore[email]; // Clear OTP after use
        res.status(200).json({ message: 'Password reset successfully!' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Error updating password' });
    }
});

// Activity Logs APIs
// Get all activity logs
app.get('/api/activity-logs', async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(500);
        res.status(200).json(logs);
    } catch (err) {
        console.error('Error fetching activity logs:', err);
        res.status(500).json({ message: 'Error fetching activity logs', error: err.message });
    }
});

// Clear all activity logs
app.delete('/api/activity-logs', async (req, res) => {
    try {
        await ActivityLog.deleteMany({});
        // Notify all admins that logs were cleared
        logActivity('SYSTEM', 'Admin', 'admin@system.com', 'LOGS_CLEARED', 'All activity logs were cleared by an administrator');
        res.status(200).json({ message: 'All activity logs have been cleared' });
    } catch (err) {
        console.error('Error clearing activity logs:', err);
        res.status(500).json({ message: 'Error clearing activity logs', error: err.message });
    }
});

// Get activity logs for specific user
app.get('/api/activity-logs/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const logs = await ActivityLog.find({ userId })
            .sort({ createdAt: -1 })
            .limit(100);
        res.status(200).json(logs);
    } catch (err) {
        console.error('Error fetching user activity logs:', err);
        res.status(500).json({ message: 'Error fetching user activity logs', error: err.message });
    }
});

// User Management APIs
// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('_id name email password role');
        // Map to match old format with 'id' field
        const formattedUsers = users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role
        }));
        res.status(200).json(formattedUsers);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

// Add new user
app.post('/api/users', async (req, res) => {
    const { name, email, password, role, performedBy } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        // Log user creation
        if (performedBy) {
            logActivity(performedBy.id, performedBy.name, performedBy.email, 'USER_CREATED', `Created user: ${name} (${email}) with role: ${role || 'user'}`);
        }

        res.status(201).json({ message: 'User created successfully', id: newUser._id });
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).json({ message: 'Error creating user', error: err.message });
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    const { name, email, password, role, performedBy } = req.body;
    const { id } = req.params;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, email, password: hashedPassword, role },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Log user update
        if (performedBy) {
            logActivity(performedBy.id, performedBy.name, performedBy.email, 'USER_UPDATED', `Updated user: ${name} (${email})`);
        }

        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Error updating user', error: err.message });
    }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Check if the user being deleted is an admin
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            // Check how many admins are left
            const adminCount = await User.countDocuments({ role: 'admin' });

            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last administrator. At least one admin must exist.' });
            }
        }

        // Proceed to delete
        await User.findByIdAndDelete(id);

        // Log user deletion
        if (req.body.performedBy) {
            logActivity(req.body.performedBy.id, req.body.performedBy.name, req.body.performedBy.email, 'USER_DELETED', `Deleted user: ${user.name} (${user.email})`);
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Error deleting user', error: err.message });
    }
});

// Catch-all route for debugging
app.use((req, res) => {
    console.log(`404 at ${req.url}`);
    res.status(404).json({ message: `Route ${req.url} not found on this server` });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
