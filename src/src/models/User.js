// src/models/User.js
import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const createUser = async (name, email, password, role = "user", level = 2, department = null) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
    INSERT INTO users (name, email, password_hash, role, level, department, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    RETURNING id, name, email, role, level, department
  `;
    const result = await pool.query(query, [name, email, hashedPassword, role, level, department]);
    return result.rows[0];
};

export const findUserByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
};

export const findUserById = async (id) => {
    const result = await pool.query(`SELECT id, name, email, role, level, department FROM users WHERE id = $1`, [id]);
    return result.rows[0];
};
