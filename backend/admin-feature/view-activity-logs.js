const express = require('express');
const router = express.Router();
const { ActivityLog } = require('../common-helpers/database-schemas');
const { logActivity } = require('../common-helpers/activity-recorder');

module.exports = (io) => {
    // Activity Log Routes
    router.get('/activity-logs', async (req, res) => {
        try {
            const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(500);
            res.status(200).json(logs);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.delete('/activity-logs', async (req, res) => {
        try {
            await ActivityLog.deleteMany({});
            logActivity(io, 'SYSTEM', 'Admin', 'admin@system.com', 'LOGS_CLEARED', 'All logs cleared');
            res.status(200).json({ message: 'Cleared' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
};
