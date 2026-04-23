const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ActivityLog, PushSubscription } = require('../shared/models');
const { logActivity } = require('../shared/logger');
const { sendPushNotification, VAPID_PUBLIC_KEY } = require('../shared/push');

module.exports = (io) => {
    // --- USER MANAGEMENT ---
    router.get('/users', async (req, res) => {
        const users = await User.find().select('_id name email role');
        res.status(200).json(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
    });

    router.post('/users', async (req, res) => {
        const { name, email, password, role, performedBy } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hashedPassword, role });
        if (performedBy) logActivity(io, performedBy.id, performedBy.name, performedBy.email, 'USER_CREATED', `Created: ${email}`);
        res.status(201).json({ id: newUser._id });
    });

    router.put('/users/:id', async (req, res) => {
        const { name, email, password, role, performedBy } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(req.params.id, { name, email, password: hashedPassword, role });
        if (performedBy) logActivity(io, performedBy.id, performedBy.name, performedBy.email, 'USER_UPDATED', `Updated: ${email}`);
        res.status(200).json({ message: 'Updated' });
    });

    router.delete('/users/:id', async (req, res) => {
        const user = await User.findById(req.params.id);
        if (user.role === 'admin' && await User.countDocuments({ role: 'admin' }) <= 1) return res.status(400).json({ message: 'Last admin' });
        await User.findByIdAndDelete(req.params.id);
        if (req.body.performedBy) logActivity(io, req.body.performedBy.id, req.body.performedBy.name, req.body.performedBy.email, 'USER_DELETED', `Deleted: ${user.email}`);
        res.status(200).json({ message: 'Deleted' });
    });

    // --- ACTIVITY LOGS ---
    router.get('/activity-logs', async (req, res) => {
        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(500);
        res.status(200).json(logs);
    });

    router.delete('/activity-logs', async (req, res) => {
        await ActivityLog.deleteMany({});
        logActivity(io, 'SYSTEM', 'Admin', 'admin@system.com', 'LOGS_CLEARED', 'All logs cleared');
        res.status(200).json({ message: 'Cleared' });
    });

    // --- PUSH NOTIFICATIONS ---
    router.get('/push/vapid-public-key', (req, res) => res.json({ publicKey: VAPID_PUBLIC_KEY }));
    router.post('/push/test', async (req, res) => {
        await sendPushNotification('Test', 'Working!');
        res.json({ message: 'Sent' });
    });

    router.post('/push/subscribe', async (req, res) => {
        const sub = req.body;
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ message: 'Unauthorized' });
        try {
            const decoded = jwt.verify(auth.substring(7), process.env.JWT_SECRET);
            await PushSubscription.findOneAndUpdate({ endpoint: sub.endpoint }, { ...sub, role: decoded.role }, { upsert: true });
            res.status(201).json({ message: 'Subscribed' });
        } catch (err) { res.status(401).json({ message: 'Invalid token' }); }
    });

    router.post('/push/unsubscribe', async (req, res) => {
        await PushSubscription.deleteOne({ endpoint: req.body.endpoint });
        res.status(200).json({ message: 'Unsubscribed' });
    });

    return router;
};
