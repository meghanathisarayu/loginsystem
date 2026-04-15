const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Connecting to database...');
    const [users] = await connection.execute('SELECT id, password FROM users');

    for (const user of users) {
        // Only hash if it's not already a bcrypt hash (bcrypt hashes usually start with $2)
        if (!user.password.startsWith('$2')) {
            console.log(`Hashing password for User ID: ${user.id}`);
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        }
    }

    console.log('Migration complete! All passwords are now hashed.');
    await connection.end();
}

migrate().catch(console.error);
