const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/login_system');
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

const hashPasswords = async () => {
    await connectDB();
    
    try {
        // Get all users
        const users = await User.find();
        
        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2)
            if (!user.password.startsWith('$2')) {
                // Hash the plain text password
                const hashedPassword = await bcrypt.hash(user.password, 10);
                user.password = hashedPassword;
                await user.save();
                console.log(`Updated password for: ${user.email}`);
            } else {
                console.log(`Already hashed: ${user.email}`);
            }
        }
        
        console.log('\nAll passwords updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

hashPasswords();
