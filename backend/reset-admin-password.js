const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { User } = require('./common-helpers/database-schemas');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/login_system';
        await mongoose.connect(uri);
        console.log('MongoDB Connected to:', uri.split('@')[1] || 'localhost'); 
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

const resetPassword = async () => {
    await connectDB();
    
    try {
        // Set new password for admin
        const newPassword = 'admin123'; // Aap yahan apna password daal sakte hain
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const result = await User.updateOne(
            { email: 'admin@gmail.com' },
            { password: hashedPassword }
        );
        
        if (result.modifiedCount > 0) {
            console.log('Admin password reset successfully!');
            console.log('Email: admin@gmail.com');
            console.log('Password:', newPassword);
        } else {
            console.log('User not found or password not changed');
        }
        
        // Also reset for sarayu
        const hashedPassword2 = await bcrypt.hash('user123', 10);
        await User.updateOne(
            { email: 'sarayu@gmail.com' },
            { password: hashedPassword2 }
        );
        console.log('Sarayu password reset successfully! (Password: user123)');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

resetPassword();
