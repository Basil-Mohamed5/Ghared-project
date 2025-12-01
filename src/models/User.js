import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const createUser = async (name, email, password, role) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `;
    const result = await pool.query(query, [name, email, hashedPassword, role]);
    const userId = result.rows[0].id;
    const userRows = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
    return userRows.rows[0];
};

export const findUserByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
};
