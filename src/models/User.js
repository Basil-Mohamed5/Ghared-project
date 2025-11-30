import pool from "../config/db.js";
import bcrypt from "bcrypt";

// ───────────────────────────────
// إنشاء مستخدم جديد
// ───────────────────────────────
export const createUser = async (name, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
        INSERT INTO "User" (full_name, email, password_hash, password)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id, full_name, email;
    `;

    const result = await pool.query(query, [name, email, hashedPassword, password]);
    return result.rows[0];
};

// ───────────────────────────────
// البحث عن مستخدم بالـ Email
// ───────────────────────────────
export const findUserByEmail = async (email) => {
    const query = `SELECT * FROM "User" WHERE email = $1 LIMIT 1;`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
};

// ───────────────────────────────
// البحث عن مستخدم بالـ ID
// ───────────────────────────────
export const findUserById = async (id) => {
    const query = `
        SELECT 
            user_id, full_name, email, role, created_at 
        FROM "User"
        WHERE user_id = $1
        LIMIT 1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// ───────────────────────────────
// تحديث بيانات مستخدم
// ───────────────────────────────
export const updateUser = async (id, fields) => {
    const allowedFields = ["full_name", "email", "password", "role"];
    const updates = [];
    const values = [];

    let i = 1;

    for (const key of Object.keys(fields)) {
        if (!allowedFields.includes(key)) continue;

        if (key === "password") {
            fields[key] = await bcrypt.hash(fields[key], 10);
        }

        updates.push(`${key} = $${i}`);
        values.push(fields[key]);
        i++;
    }

    values.push(id);

    const query = `
        UPDATE "User"
        SET ${updates.join(", ")}
        WHERE user_id = $${i}
        RETURNING user_id, full_name, email, role, updated_at;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
};

// ───────────────────────────────
// حذف مستخدم
// ───────────────────────────────
export const deleteUser = async (id) => {
    const query = `DELETE FROM "User" WHERE user_id = $1 RETURNING user_id;`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};
