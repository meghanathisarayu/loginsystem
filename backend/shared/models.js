const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Activity Log Schema
const activityLogSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String }
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

// Push Subscription Schema
const pushSubscriptionSchema = new mongoose.Schema({
    endpoint: { type: String, required: true, unique: true },
    expirationTime: { type: Number },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    role: { type: String, default: 'user' }
}, { timestamps: true });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

// DB Connection helper
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/login_system');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = { User, ActivityLog, PushSubscription, connectDB };
