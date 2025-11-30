import pool from "./config/db.js";
import bcrypt from "bcrypt";

const insertTestData = async () => {
    try {
        console.log("Inserting test data...");

        // Insert departments
        try {
            await pool.query(`
                INSERT INTO "Department" (department_name) VALUES
                ('IT Department'),
                ('HR Department');
            `);
        } catch (err) {
            console.log("Departments may already exist:", err.message);
        }

        // Insert roles
        try {
            await pool.query(`
                INSERT INTO "Role" (role_name) VALUES
                ('Manager'),
                ('Employee');
            `);
        } catch (err) {
            console.log("Roles may already exist:", err.message);
        }

        // Insert department roles
        try {
            await pool.query(`
                INSERT INTO "Department_Role" (department_id, role_id) VALUES
                (1, 1), -- IT Manager
                (1, 2), -- IT Employee
                (2, 1), -- HR Manager
                (2, 2); -- HR Employee
            `);
        } catch (err) {
            console.log("Department roles may already exist:", err.message);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash("password123", 10);

        // Insert users
        try {
            await pool.query(`
                INSERT INTO "User" (full_name, email, password_hash, phone_number) VALUES
                ('Admin User', 'admin@example.com', $1, '1234567890'),
                ('Test User 1', 'test1@example.com', $1, '1234567891'),
                ('Test User 2', 'test2@example.com', $1, '1234567892'),
                ('Test User 3', 'test3@example.com', $1, '1234567893');
            `, [hashedPassword]);
        } catch (err) {
            console.log("Users may already exist:", err.message);
        }

        // Insert user memberships
        try {
            await pool.query(`
                INSERT INTO "User_Membership" (user_id, dep_role_id) VALUES
                (1, 1), -- Admin in IT Manager
                (2, 2), -- Test1 in IT Employee
                (3, 3), -- Test2 in HR Manager
                (4, 4); -- Test3 in HR Employee
            `);
        } catch (err) {
            console.log("User memberships may already exist:", err.message);
        }

        // Insert transaction types
        try {
            await pool.query(`
                INSERT INTO "Transaction_Type" (type_name) VALUES
                ('General'),
                ('Acknowledgment');
            `);
        } catch (err) {
            console.log("Transaction types may already exist:", err.message);
        }

        console.log("Test data inserted successfully!");
    } catch (err) {
        console.error("Error inserting test data:", err);
    }
};

const testDB = async () => {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("Database Connected", result.rows[0]);
        await insertTestData();
    } catch (err) {
        console.error("Database Error:", err);
    } finally {
        process.exit();
    }
};

testDB();
