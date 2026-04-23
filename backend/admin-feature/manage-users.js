const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../common-helpers/database-schemas');
const { logActivity } = require('../common-helpers/activity-recorder');

module.exports = (io) => {
    // CRUD for Users
    router.get('/users', async (req, res) => {
        try {
            const users = await User.find().select('_id name email role');
            res.status(200).json(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.post('/users', async (req, res) => {
        const { name, email, password, role, performedBy } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({ name, email, password: hashedPassword, role });
            if (performedBy) logActivity(io, performedBy.id, performedBy.name, performedBy.email, 'USER_CREATED', `Created: ${email}`);
            res.status(201).json({ id: newUser._id });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.put('/users/:id', async (req, res) => {
        const { name, email, password, role, performedBy } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.findByIdAndUpdate(req.params.id, { name, email, password: hashedPassword, role });
            if (performedBy) logActivity(io, performedBy.id, performedBy.name, performedBy.email, 'USER_UPDATED', `Updated: ${email}`);
            res.status(200).json({ message: 'Updated' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.delete('/users/:id', async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (user.role === 'admin' && await User.countDocuments({ role: 'admin' }) <= 1) return res.status(400).json({ message: 'Last admin' });
            await User.findByIdAndDelete(req.params.id);
            if (req.body.performedBy) logActivity(io, req.body.performedBy.id, req.body.performedBy.name, req.body.performedBy.email, 'USER_DELETED', `Deleted: ${user.email}`);
            res.status(200).json({ message: 'Deleted' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
};
