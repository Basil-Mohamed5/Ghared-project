import pool from './src/config/db.js';
import bcrypt from 'bcrypt';

const updatePassword = async () => {
    try {
        const hash = await bcrypt.hash('1234', 10);
        await pool.query('UPDATE "User" SET password_hash = $1 WHERE user_id = 1', [hash]);
        console.log('Password updated successfully');
    } catch (err) {
        console.error('Error updating password:', err);
    } finally {
        process.exit();
    }
};

updatePassword();
