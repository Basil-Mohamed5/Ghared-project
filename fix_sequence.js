import pool from "./src/config/db.js";

async function fixSequence() {
    try {
        // Get the max user_id
        const result = await pool.query('SELECT MAX(user_id) as max_id FROM "User"');
        const maxId = result.rows[0].max_id || 0;

        // Reset the sequence to max_id + 1
        await pool.query(`SELECT setval('"User_user_id_seq"', ${maxId + 1})`);

        console.log(`Sequence reset to ${maxId + 1}`);
    } catch (error) {
        console.error("Error fixing sequence:", error);
    } finally {
        pool.end();
    }
}

fixSequence();
