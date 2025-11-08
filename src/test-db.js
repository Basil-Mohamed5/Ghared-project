import pool from "./db.js";

try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database time:", result.rows[0]);
    process.exit(0);
} catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
}
