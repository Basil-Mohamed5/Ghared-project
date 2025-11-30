import pool from "./src/config/db.js";

async function checkUsers() {
    try {
        const result = await pool.query('SELECT user_id, full_name, email FROM "User"');
        console.log("Users in database:");
        result.rows.forEach(user => {
            console.log(`ID: ${user.user_id}, Name: ${user.full_name}, Email: ${user.email}`);
        });
    } catch (error) {
        console.error("Error checking users:", error);
    } finally {
        pool.end();
    }
}

checkUsers();
