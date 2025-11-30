// src/routes/endpoints.js
import express from "express";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkRole, checkPermission } from "../middleware/checkRole.js";

const router = express.Router();

// ───────────────────────────────
// الحصول على جميع المستخدمين (للإدارة فقط)
// ───────────────────────────────
router.get("/users", protect, checkPermission("manage_users"), async (req, res) => {
    try {
        const query = `
            SELECT user_id, full_name, email, role, created_at, is_first_login
            FROM "User"
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "خطأ في استرجاع المستخدمين" });
    }
});

// ───────────────────────────────
// الحصول على مستخدم محدد
// ───────────────────────────────
router.get("/users/:id", protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // التحقق من الصلاحية (يمكن للمستخدم رؤية بياناته أو الإدارة رؤية الجميع)
        if (userId != id && !req.user.role.includes('admin')) {
            return res.status(403).json({ error: "الوصول مرفوض" });
        }

        const query = `
            SELECT user_id, full_name, email, role, mobile_number, landline, fax_number,
                   profile_picture, created_at, updated_at, is_first_login
            FROM "User"
            WHERE user_id = $1
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "المستخدم غير موجود" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ error: "خطأ في استرجاع المستخدم" });
    }
});

// ───────────────────────────────
// تحديث بيانات مستخدم
// ───────────────────────────────
router.put("/users/:id", protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        // التحقق من الصلاحية
        if (userId != id && !req.user.role.includes('admin')) {
            return res.status(403).json({ error: "الوصول مرفوض" });
        }

        const allowedFields = ["full_name", "email", "mobile_number", "landline", "fax_number", "profile_picture"];
        const updateFields = {};
        const values = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateFields[field] = `$${paramIndex}`;
                values.push(updates[field]);
                paramIndex++;
            }
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: "لا توجد حقول للتحديث" });
        }

        values.push(id);

        const query = `
            UPDATE "User"
            SET ${Object.entries(updateFields).map(([key, value]) => `${key} = ${value}`).join(', ')},
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $${paramIndex}
            RETURNING user_id, full_name, email, role, updated_at
        `;

        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ error: "خطأ في تحديث المستخدم" });
    }
});

// ───────────────────────────────
// حذف مستخدم (للإدارة العليا فقط)
// ───────────────────────────────
router.delete("/users/:id", protect, checkPermission("manage_users"), async (req, res) => {
    try {
        const { id } = req.params;

        const query = `DELETE FROM "User" WHERE user_id = $1 RETURNING user_id, full_name, email`;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "المستخدم غير موجود" });
        }

        res.json({ message: "تم حذف المستخدم بنجاح", deletedUser: result.rows[0] });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ error: "خطأ في حذف المستخدم" });
    }
});

// ───────────────────────────────
// الحصول على جميع الأدوار
// ───────────────────────────────
router.get("/roles", protect, checkPermission("manage_roles"), async (req, res) => {
    try {
        const query = `
            SELECT r.role_id, r.role_name, r.role_level,
                   d.department_name, c.college_name
            FROM "Role" r
            JOIN "Department_Role" dr ON r.role_id = dr.role_id
            JOIN "Department" d ON dr.department_id = d.department_id
            JOIN "College" c ON d.college_id = c.college_id
            ORDER BY r.role_level DESC, c.college_name, d.department_name
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching roles:", err);
        res.status(500).json({ error: "خطأ في استرجاع الأدوار" });
    }
});

// ───────────────────────────────
// الحصول على إحصائيات النظام
// ───────────────────────────────
router.get("/stats", protect, checkPermission("view_global_reports"), async (req, res) => {
    try {
        const stats = {};

        // عدد المستخدمين
        const usersQuery = `SELECT COUNT(*) as total_users FROM "User"`;
        const usersResult = await pool.query(usersQuery);
        stats.total_users = parseInt(usersResult.rows[0].total_users);

        // عدد المعاملات
        const transactionsQuery = `SELECT COUNT(*) as total_transactions FROM "Transaction"`;
        const transactionsResult = await pool.query(transactionsQuery);
        stats.total_transactions = parseInt(transactionsResult.rows[0].total_transactions);

        // عدد المعاملات النشطة
        const activeTransactionsQuery = `SELECT COUNT(*) as active_transactions FROM "Transaction" WHERE current_status = 'active'`;
        const activeResult = await pool.query(activeTransactionsQuery);
        stats.active_transactions = parseInt(activeResult.rows[0].active_transactions);

        // عدد المسودات
        const draftsQuery = `SELECT COUNT(*) as total_drafts FROM "Draft"`;
        const draftsResult = await pool.query(draftsQuery);
        stats.total_drafts = parseInt(draftsResult.rows[0].total_drafts);

        // عدد الأقسام
        const departmentsQuery = `SELECT COUNT(*) as total_departments FROM "Department"`;
        const departmentsResult = await pool.query(departmentsQuery);
        stats.total_departments = parseInt(departmentsResult.rows[0].total_departments);

        res.json(stats);
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ error: "خطأ في استرجاع الإحصائيات" });
    }
});

// ───────────────────────────────
// البحث في المعاملات
// ───────────────────────────────
router.get("/search/transactions", protect, async (req, res) => {
    try {
        const { q, type, status, date_from, date_to, limit = 50, offset = 0 } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereConditions = [];
        let values = [];
        let paramIndex = 1;

        // فلترة حسب الصلاحيات
        if (userRole === 'user') {
            whereConditions.push(`(t.sender_user_id = $${paramIndex} OR tr.receiver_user_id = $${paramIndex})`);
            values.push(userId);
            paramIndex++;
        }

        // البحث النصي
        if (q) {
            whereConditions.push(`(t.subject ILIKE $${paramIndex} OR t.content ILIKE $${paramIndex})`);
            values.push(`%${q}%`);
            paramIndex++;
        }

        // فلترة حسب النوع
        if (type) {
            whereConditions.push(`t.type_id = $${paramIndex}`);
            values.push(type);
            paramIndex++;
        }

        // فلترة حسب الحالة
        if (status) {
            whereConditions.push(`t.current_status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
        }

        // فلترة حسب التاريخ
        if (date_from) {
            whereConditions.push(`t.date >= $${paramIndex}`);
            values.push(date_from);
            paramIndex++;
        }

        if (date_to) {
            whereConditions.push(`t.date <= $${paramIndex}`);
            values.push(date_to);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT t.transaction_id, t.subject, t.content, t.date, t.current_status,
                   tt.type_name, u.full_name as sender_name,
                   COUNT(tr.receiver_user_id) as receiver_count
            FROM "Transaction" t
            JOIN "Transaction_Type" tt ON t.type_id = tt.type_id
            JOIN "User" u ON t.sender_user_id = u.user_id
            LEFT JOIN "Transaction_Receiver" tr ON t.transaction_id = tr.transaction_id
            ${whereClause}
            GROUP BY t.transaction_id, t.subject, t.content, t.date, t.current_status, tt.type_name, u.full_name
            ORDER BY t.date DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        values.push(limit, offset);

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error("Error searching transactions:", err);
        res.status(500).json({ error: "خطأ في البحث عن المعاملات" });
    }
});

// ───────────────────────────────
// الحصول على سجلات النظام (للإدارة العليا فقط)
// ───────────────────────────────
router.get("/logs", protect, checkPermission("view_audit_logs"), async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;

        // افتراض وجود جدول للسجلات - يمكن تعديله حسب قاعدة البيانات الفعلية
        const query = `
            SELECT action_id, action_name, execution_date, annotation,
                   performer_user_id, target_department_id, transaction_id
            FROM "Action"
            ORDER BY execution_date DESC
            LIMIT $1 OFFSET $2
        `;

        const result = await pool.query(query, [limit, offset]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ error: "خطأ في استرجاع السجلات" });
    }
});

// ───────────────────────────────
// إعادة تعيين كلمة مرور مستخدم (للإدارة فقط)
// ───────────────────────────────
router.post("/users/:id/reset-password", protect, checkPermission("manage_users"), async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const query = `
            UPDATE "User"
            SET password_hash = $1, password = $2, is_first_login = true, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $3
            RETURNING user_id, full_name, email
        `;

        const result = await pool.query(query, [hashedPassword, newPassword, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "المستخدم غير موجود" });
        }

        res.json({ message: "تم إعادة تعيين كلمة المرور بنجاح", user: result.rows[0] });
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ error: "خطأ في إعادة تعيين كلمة المرور" });
    }
});

export default router;
