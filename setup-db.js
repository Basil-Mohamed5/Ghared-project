import fs from 'fs';
import pool from './src/config/db.js';

const sql = fs.readFileSync('tables.sql', 'utf8');

const queries = sql.split(';').filter(q => q.trim());

(async () => {
    for (const query of queries) {
        if (query.trim()) {
            try {
                await pool.execute(query);
                console.log('Executed:', query.substring(0, 50) + '...');
            } catch (err) {
                console.error('Error executing query:', err.message);
            }
        }
    }
    console.log('Database setup complete');
    process.exit();
})();
