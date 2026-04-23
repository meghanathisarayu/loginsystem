const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../common-helpers/database-schemas');
const { logActivity } = require('../common-helpers/activity-recorder');

let loginAttempts = {};

module.exports = (io) => {
    // Main Login Route
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

        if (!loginAttempts[email]) loginAttempts[email] = { count: 0, lockUntil: 0 };
        if (loginAttempts[email].lockUntil > Date.now()) return res.status(403).json({ message: 'Locked' });

        try {
            const user = await User.findOne({ email });
            if (user && await bcrypt.compare(password, user.password)) {
                loginAttempts[email] = { count: 0, lockUntil: 0 };
                const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
                logActivity(io, user._id, user.name, user.email, 'LOGIN', 'Successful');
                res.status(200).json({ message: 'Success', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
            } else {
                loginAttempts[email].count++;
                if (loginAttempts[email].count >= 4) loginAttempts[email].lockUntil = Date.now() + 120000;
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
};
