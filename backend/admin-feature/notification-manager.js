const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PushSubscription } = require('../common-helpers/database-schemas');
const { sendPushNotification, VAPID_PUBLIC_KEY } = require('../common-helpers/push-setup');

module.exports = () => {
    // Push Notification Management
    router.get('/push/vapid-public-key', (req, res) => res.json({ publicKey: VAPID_PUBLIC_KEY }));

    router.post('/push/test', async (req, res) => {
        try {
            await sendPushNotification('Test', 'Working!');
            res.json({ message: 'Sent' });
        } catch (err) { res.status(500).json({ error: err.message }); }
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
        try {
            await PushSubscription.deleteOne({ endpoint: req.body.endpoint });
            res.status(200).json({ message: 'Unsubscribed' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
};
