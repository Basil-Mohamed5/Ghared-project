// src/middleware/checkRole.js
import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rolesConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "../config/roles.json"), "utf8"));

// يتحقق أن المرسل مسموح له يرسل للمُستلمين (حسب level)
export const checkSendPermission = async (req, res, next) => {
    try {
        // يجب أن يكون protect تمت تنفيذه قبل هذا الميدلوير
        const senderToken = req.user; // { id, role, ... }
        if (!senderToken?.id) return res.status(401).json({ error: "غير مصرح لك" });

        // جلب مستوى المرسل من DB
        const senderRes = await pool.query(`
            SELECT r.role_level
            FROM "User" u
            JOIN "User_Membership" um ON u.user_id = um.user_id
            JOIN "Department_Role" dr ON um.dep_role_id = dr.dep_role_id
            JOIN "Role" r ON dr.role_id = r.role_id
            WHERE u.user_id = $1
            LIMIT 1
        `, [senderToken.id]);
        if (!senderRes.rows[0]) return res.status(404).json({ error: "المرسل غير موجود أو لا يملك دور" });
        const senderLevel = senderRes.rows[0].role_level;

        const { receiver_user_id, receiver_user_ids } = req.body;
        const receivers = Array.isArray(receiver_user_ids)
            ? receiver_user_ids
            : receiver_user_id ? [receiver_user_id] : [];

        for (const rid of receivers) {
            const r = await pool.query(`
                SELECT r.role_level
                FROM "User" u
                JOIN "User_Membership" um ON u.user_id = um.user_id
                JOIN "Department_Role" dr ON um.dep_role_id = dr.dep_role_id
                JOIN "Role" r ON dr.role_id = r.role_id
                WHERE u.user_id = $1
                LIMIT 1
            `, [rid]);
            if (!r.rows[0]) return res.status(404).json({ error: `Receiver ${rid} not found or has no role` });
            const receiverLevel = r.rows[0].role_level;
            if (senderLevel < receiverLevel) {
                return res.status(403).json({ error: `لا يمكنك الإرسال للمستخدم رقم ${rid} لأنه يملك مستوى أعلى` });
            }
        }

        next();
    } catch (err) {
        console.error("Error in checkSendPermission:", err);
        res.status(500).json({ error: "خطأ داخلي في الخادم" });
    }
};

// simple role-checker
export const checkRole = (allowedRoles = []) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) return res.status(401).json({ message: "دور المستخدم غير موجود" });
        if (!allowedRoles.includes(userRole)) return res.status(403).json({ message: "الوصول مرفوض" });
        next();
    };
};

// check permission based on roles.json
export const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) return res.status(401).json({ message: "User role not found" });

        const roleData = rolesConfig.roles[userRole];
        if (!roleData) return res.status(403).json({ message: "Invalid role" });

        // جمع الصلاحيات مع الوراثة
        const allPermissions = getAllPermissions(userRole);

        if (!allPermissions.includes(requiredPermission)) {
            return res.status(403).json({ message: "Access denied" });
        }

        next();
    };
};

// دالة مساعدة لجمع الصلاحيات مع الوراثة
const getAllPermissions = (roleName) => {
    const role = rolesConfig.roles[roleName];
    if (!role) return [];

    let permissions = [...(role.permissions || [])];

    if (role.inherits) {
        for (const inheritedRole of role.inherits) {
            permissions = [...permissions, ...getAllPermissions(inheritedRole)];
        }
    }

    return [...new Set(permissions)]; // إزالة التكرارات
};
