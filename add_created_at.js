import pool from "./src/config/db.js";

async function addCreatedAtColumn() {
    try {
        const query = `ALTER TABLE "User" ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`;
        await pool.query(query);
        console.log("Added created_at column successfully");
    } catch (error) {
        console.error("Error adding column:", error);
    } finally {
        pool.end();
    }
}

addCreatedAtColumn();
