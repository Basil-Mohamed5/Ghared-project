import pool from "./src/config/db.js";

async function setupTestDB() {
    try {
        // Insert roles
        await pool.query(`
            INSERT INTO "Role" (role_name, role_level) VALUES
            ('admin', 10),
            ('manager', 5),
            ('user', 1)
            ON CONFLICT DO NOTHING
        `);

        // Insert college
        await pool.query(`
            INSERT INTO "College" (college_name) VALUES ('Test College')
            ON CONFLICT DO NOTHING
        `);

        // Insert department
        await pool.query(`
            INSERT INTO "Department" (department_name, college_id, department_type) VALUES
            ('Test Department', 1, 'academic')
            ON CONFLICT DO NOTHING
        `);

        // Insert department roles
        await pool.query(`
            INSERT INTO "Department_Role" (department_id, role_id) VALUES
            (1, 1), (1, 2), (1, 3)
            ON CONFLICT DO NOTHING
        `);

        // Insert transaction types
        await pool.query(`
            INSERT INTO "Transaction_Type" (type_name) VALUES
            ('General'), ('Acknowledgment')
            ON CONFLICT DO NOTHING
        `);

        // Create test users with roles
        const users = [
            { name: 'Admin User', email: 'admin@example.com', password: '1234', dep_role_id: 1 },
            { name: 'Manager User', email: 'manager@example.com', password: '1234', dep_role_id: 2 },
            { name: 'Regular User', email: 'user@example.com', password: '1234', dep_role_id: 3 }
        ];

        for (const user of users) {
            // Check if user exists
            const existingUser = await pool.query(`SELECT user_id FROM "User" WHERE email = $1`, [user.email]);

            let userId;
            if (existingUser.rows.length === 0) {
                // Insert user
                const userRes = await pool.query(`
                    INSERT INTO "User" (full_name, email, password_hash, password, role)
                    VALUES ($1, $2, $3, $4, 'user')
                    RETURNING user_id
                `, [user.name, user.email, user.password, user.password]);
                userId = userRes.rows[0].user_id;
            } else {
                userId = existingUser.rows[0].user_id;
            }

            // Check if membership exists
            const existingMembership = await pool.query(`
                SELECT user_membership_id FROM "User_Membership"
                WHERE user_id = $1 AND dep_role_id = $2
            `, [userId, user.dep_role_id]);

            if (existingMembership.rows.length === 0) {
                // Assign role
                await pool.query(`
                    INSERT INTO "User_Membership" (user_id, dep_role_id, start_date)
                    VALUES ($1, $2, CURRENT_DATE)
                `, [userId, user.dep_role_id]);
            }
        }

        console.log("Test database setup complete");
    } catch (error) {
        console.error("Error setting up test DB:", error);
    } finally {
        pool.end();
    }
}

setupTestDB();
