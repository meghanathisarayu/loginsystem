const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./common-helpers/database-schemas');

const MONGODB_URI= process.env.MONGODB_URI || 'mongodb://localhost:27017/login_system';

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected for seeding');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            name: 'Admin User',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'admin'
        });

        // Create sample user
        const userPassword = await bcrypt.hash('user123', 10);
        await User.create({
            name: 'Sarayu User',
            email: 'sarayu@gmail.com',
            password: userPassword,
            role: 'user'
        });

        console.log('Seed data added successfully!');
        console.log('Admin: admin@gmail.com / admin123');
        console.log('User: sarayu@gmail.com / user123');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
