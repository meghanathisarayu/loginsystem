const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const emailjs = require('@emailjs/nodejs');
const bcrypt = require('bcryptjs');                  

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Temporary store for OTPs
let otpStore = {};

// Temporary store for login attempts
let loginAttempts = {};

// Activity Log Helper Function
function logActivity(userId, userName, userEmail, action, details = '') {
    const timestamp = new Date();
    const query = `INSERT INTO activity_logs (user_id, user_name, user_email, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(query, [userId, userName, userEmail, action, details, timestamp], (err) => {
        if (err) console.error('Error logging activity:', err);
    });
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

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Login API
app.post('/api/login', (req, res) => {
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

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal Server Error', error: err });

        if (results.length > 0) {
            const user = results[0];

            // Compare hashed password
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                // SUCCESS: Reset attempts on successful login
                loginAttempts[email] = { count: 0, lockUntil: 0 };

                const token = jwt.sign(
                    { id: user.id, role: user.role, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                // Log successful login
                logActivity(user.id, user.name, user.email, 'LOGIN', 'User logged in successfully');

                res.status(200).json({
                    message: 'Login successful',
                    token: token,
                    user: {
                        id: user.id,
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
    });
});

// --- Forgot Password Flow ---

// 1. Request OTP
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'No user found with this email' });

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
    });
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
        db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err, results) => {
            if (err) return res.status(500).json({ message: 'Error updating password' });
            delete otpStore[email]; // Clear OTP after use
            res.status(200).json({ message: 'Password reset successfully!' });
        });
    } catch (err) {
        res.status(500).json({ message: 'Error hashing password' });
    }
});

// Activity Logs APIs
// Get all activity logs
app.get('/api/activity-logs', (req, res) => {
    const query = `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 500`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching activity logs', error: err });
        res.status(200).json(results);
    });
});

// Get activity logs for specific user
app.get('/api/activity-logs/user/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching user activity logs', error: err });
        res.status(200).json(results);
    });
});

// User Management APIs
// Get all users
app.get('/api/users', (req, res) => {
    db.query('SELECT id, name, email, password, role FROM users', (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching users', error: err });
        res.status(200).json(results);
    });
});

// Add new user
app.post('/api/users', async (req, res) => {
    const { name, email, password, role, performedBy } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role || 'user'], (err, results) => {
                if (err) {
                    console.error('SQL Error adding user:', err);
                    return res.status(500).json({ message: 'Error creating user', error: err.message });
                }
                // Log user creation
                if (performedBy) {
                    logActivity(performedBy.id, performedBy.name, performedBy.email, 'USER_CREATED', `Created user: ${name} (${email}) with role: ${role || 'user'}`);
                }
                res.status(201).json({ message: 'User created successfully', id: results.insertId });
            });
    } catch (err) {
        res.status(500).json({ message: 'Error hashing password' });
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    const { name, email, password, role, performedBy } = req.body;
    const { id } = req.params;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
            [name, email, hashedPassword, role, id], (err, results) => {
                if (err) return res.status(500).json({ message: 'Error updating user', error: err });
                // Log user update
                if (performedBy) {
                    logActivity(performedBy.id, performedBy.name, performedBy.email, 'USER_UPDATED', `Updated user: ${name} (${email})`);
                }
                res.status(200).json({ message: 'User updated successfully' });
            });
    } catch (err) {
        res.status(500).json({ message: 'Error hashing password' });
    }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    // Check if the user being deleted is an admin
    db.query('SELECT role FROM users WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error checking user role', error: err });

        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const userRole = results[0].role;

        if (userRole === 'admin') {
            // Check how many admins are left
            db.query('SELECT COUNT(*) as adminCount FROM users WHERE role = "admin"', (err, countResults) => {
                if (err) return res.status(500).json({ message: 'Error checking admin count', error: err });

                if (countResults[0].adminCount <= 1) {
                    return res.status(400).json({ message: 'Cannot delete the last administrator. At least one admin must exist.' });
                }

                // Proceed to delete if more than one admin
                performDelete(id, res);
            });
        } else {
            // Not an admin, just delete
            performDelete(id, res);
        }
    });

    function performDelete(userId, response) {
        // Get user info before deleting for logging
        db.query('SELECT name, email FROM users WHERE id = ?', [userId], (err, userResults) => {
            const userInfo = userResults[0];
            db.query('DELETE FROM users WHERE id = ?', [userId], (err, results) => {
                if (err) return response.status(500).json({ message: 'Error deleting user', error: err });
                // Log user deletion
                if (req.body.performedBy && userInfo) {
                    logActivity(req.body.performedBy.id, req.body.performedBy.name, req.body.performedBy.email, 'USER_DELETED', `Deleted user: ${userInfo.name} (${userInfo.email})`);
                }
                response.status(200).json({ message: 'User deleted successfully' });
            });
        });
    }
});

// Catch-all route for debugging
app.use((req, res) => {
    console.log(`404 at ${req.url}`);
    res.status(404).json({ message: `Route ${req.url} not found on this server` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
