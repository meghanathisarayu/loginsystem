const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailjs = require('@emailjs/nodejs');
const { User } = require('../shared/models');
const { logActivity } = require('../shared/logger');

let otpStore = {};
let loginAttempts = {};

emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

module.exports = (io) => {
    // Login
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

    // Forgot Password
    router.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        try {
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: 'Not found' });
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore[email] = { otp, expires: Date.now() + 600000 };
            await emailjs.send(process.env.EMAILJS_SERVICE_ID, process.env.EMAILJS_TEMPLATE_ID, { to_email: email, otp });
            res.status(200).json({ message: 'OTP sent' });
        } catch (err) { res.status(200).json({ otp: otpStore[email]?.otp }); }
    });

    router.post('/verify-otp', (req, res) => {
        const { email, otp } = req.body;
        const stored = otpStore[email];
        if (!stored || stored.otp !== otp || Date.now() > stored.expires) return res.status(400).json({ message: 'Invalid OTP' });
        res.status(200).json({ message: 'Verified' });
    });

    router.post('/reset-password', async (req, res) => {
        const { email, otp, newPassword } = req.body;
        if (!otpStore[email] || otpStore[email].otp !== otp) return res.status(400).json({ message: 'Expired' });
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.updateOne({ email }, { password: hashedPassword });
            delete otpStore[email];
            res.status(200).json({ message: 'Reset success' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
};
