import fs from 'fs';
import pool from './src/config/db.js';

const sql = fs.readFileSync('tables.sql', 'utf8');

const queries = sql.split(';').filter(q => q.trim());

export const createTables = async () => {
    for (const query of queries) {
        if (query.trim()) {
            try {
                await pool.query(query);
                console.log('Executed:', query.substring(0, 50) + '...');
            } catch (err) {
                console.error('Error executing query:', err.message);
            }
        }
    }
    console.log('Database setup complete');
};

// If this file is run directly, execute the setup
if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        await createTables();
        process.exit();
    })();
}
