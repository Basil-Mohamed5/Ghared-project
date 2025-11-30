// src/controllers/transactionController.js
import pool from "../config/db.js";
import { generateCode } from "../middleware/codeGenerator.js";

export const getTransactionTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public."Transaction_Type" ORDER BY type_id ASC');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching transaction types:", error);
        res.status(500).json({ error: "خطأ داخلي في الخادم", details: error.message });
    }
};

export const createTransaction = async (req, res) => {
    try {
        const { content, sender_user_id, type_id, subject } = req.body;
        if (!content || !sender_user_id || !type_id || !subject) {
            return res.status(400).json({ message: "الحقول المطلوبة مفقودة" });
        }
        const code = generateCode();
        const result = await pool.query(
            `INSERT INTO public."Transaction" (content, sender_user_id, type_id, subject, code, date, current_status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'active') RETURNING *`,
            [content, sender_user_id, type_id, subject, code]
        );
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(201).json({ message: "تم إنشاء المعاملة بنجاح", transaction: result.rows[0] });
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "خطأ داخلي في الخادم", details: error.message });
    }
};

export const getAllTransactions = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming req.user is set by protect middleware
        const result = await pool.query(
            `SELECT t.* FROM public."Transaction" t
             WHERE t.sender_user_id = $1 OR EXISTS (
                 SELECT 1 FROM public."Transaction_Receiver" tr WHERE tr.transaction_id = t.transaction_id AND tr.receiver_user_id = $1
             ) ORDER BY t.transaction_id ASC`,
            [userId]
        );
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "خطأ داخلي في الخادم", details: error.message });
    }
};

export const sendTransaction = async (req, res) => {
    const { sender_user_id, type_id, subject, content, receiver_user_id, receiver_user_ids } = req.body;
    const receivers = Array.isArray(receiver_user_ids) ? receiver_user_ids : receiver_user_id ? [receiver_user_id] : [];
    try {
        const code = generateCode();
        const trRes = await pool.query(
            `INSERT INTO public."Transaction" (content, sender_user_id, type_id, subject, code, date, current_status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'active') RETURNING *`,
            [content, sender_user_id, type_id, subject, code]
        );
        const transactionId = trRes.rows[0].transaction_id;
        for (const rid of receivers) {
            await pool.query(
                `INSERT INTO "Transaction_Receiver" ("transaction_id", "receiver_user_id") VALUES ($1, $2)`,
                [transactionId, rid]
            );
        }
        // إضافة الإشعارات
        if (type_id == 1) {
            // معاملة عادية: إشعار للمستلمين
            for (const rid of receivers) {
                await pool.query(
                    `INSERT INTO "Notification" (user_id, transaction_id, is_read) VALUES ($1, $2, false)`,
                    [rid, transactionId]
                );
            }
        } else if (type_id == 2) {
            // إقرار: إشعار لجميع المستخدمين في نفس القسم
            if (receivers.length > 0) {
                const depRes = await pool.query(
                    `SELECT dr.department_id FROM "User_Membership" um
                     JOIN "Department_Role" dr ON um.dep_role_id = dr.dep_role_id
                     WHERE um.user_id = $1`,
                    [receivers[0]]
                );
                if (depRes.rows.length > 0) {
                    const departmentId = depRes.rows[0].department_id;
                    const usersRes = await pool.query(
                        `SELECT um.user_id FROM "User_Membership" um
                         JOIN "Department_Role" dr ON um.dep_role_id = dr.dep_role_id
                         WHERE dr.department_id = $1`,
                        [departmentId]
                    );
                    for (const row of usersRes.rows) {
                        await pool.query(
                            `INSERT INTO "Notification" (user_id, transaction_id, is_read) VALUES ($1, $2, false)`,
                            [row.user_id, transactionId]
                        );
                    }
                }
            }
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(201).json({ message: "تم إرسال المعاملة بنجاح", transaction_id: transactionId });
    } catch (err) {
        console.error("Error sending transaction:", err);
        res.status(500).json({ error: "خطأ في قاعدة البيانات أثناء إرسال المعاملة" });
    }
};

export const getReceivedTransactions = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT t."transaction_id", t."subject", t."content", t."date", t."current_status",
              tt."type_name", u."full_name" AS sender_name
       FROM "Transaction" t
       JOIN "Transaction_Type" tt ON t."type_id" = tt."type_id"
       JOIN "User" u ON t."sender_user_id" = u."user_id"
       JOIN "Transaction_Receiver" tr ON t."transaction_id" = tr."transaction_id"
       WHERE tr."receiver_user_id" = $1
       ORDER BY t."date" DESC`,
            [userId]
        );
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching received transactions:", err);
        res.status(500).json({ error: "خطأ في قاعدة البيانات أثناء جلب المعاملات المستلمة" });
    }
};

export const replyToTransaction = async (req, res) => {
    const { sender_user_id, parent_transaction_id, subject, content } = req.body;
    try {
        // التحقق من نوع المعاملة الأصلية
        const parentTypeRes = await pool.query(
            `SELECT type_id FROM "Transaction" WHERE transaction_id = $1`,
            [parent_transaction_id]
        );
        if (parentTypeRes.rows.length === 0) return res.status(404).json({ error: "المعاملة الأصلية غير موجودة." });
        const parentTypeId = parentTypeRes.rows[0].type_id;
        if (parentTypeId == 2) {
            return res.status(400).json({ error: "لا يمكن الرد على إقرار." });
        }

        const receivers = await pool.query(
            `SELECT receiver_user_id FROM "Transaction_Receiver" WHERE transaction_id = $1`,
            [parent_transaction_id]
        );
        if (receivers.rows.length === 0) return res.status(404).json({ error: "لم يتم العثور على مستلمين للمعاملة الأصلية." });

        const newTransaction = await pool.query(
            `INSERT INTO "Transaction"
       (subject, content, sender_user_id, date, current_status, type_id, parent_transaction_id)
       VALUES ($1, $2, $3, NOW(), 'active', 1, $4) RETURNING transaction_id`,
            [subject, content, sender_user_id, parent_transaction_id]
        );
        const newTransactionId = newTransaction.rows[0].transaction_id;
        for (const row of receivers.rows) {
            if (row.receiver_user_id !== sender_user_id) {
                await pool.query(
                    `INSERT INTO "Transaction_Receiver" ("transaction_id", "receiver_user_id")
           VALUES ($1, $2)`,
                    [newTransactionId, row.receiver_user_id]
                );
            }
        }
        // إضافة إشعارات للرد (معاملة عادية)
        for (const row of receivers) {
            if (row.receiver_user_id !== sender_user_id) {
                await pool.query(
                    `INSERT INTO "Notification" (user_id, transaction_id, is_read) VALUES ($1, $2, false)`,
                    [row.receiver_user_id, newTransactionId]
                );
            }
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(201).json({ message: "تم إرسال الرد بنجاح.", reply_transaction_id: newTransactionId });
    } catch (err) {
        console.error("Error sending reply:", err);
        res.status(500).json({ error: "خطأ في قاعدة البيانات أثناء إرسال الرد." });
    }
};

export const getTransactionForPrint = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT t."transaction_id", t."subject", t."content", t."date", t."current_status",
              tt."type_name", u."full_name" AS sender_name,
              ARRAY_AGG(tr."receiver_user_id") AS receivers
       FROM "Transaction" t
       JOIN "Transaction_Type" tt ON t."type_id" = tt."type_id"
       JOIN "User" u ON t."sender_user_id" = u."user_id"
       LEFT JOIN "Transaction_Receiver" tr ON t."transaction_id" = tr."transaction_id"
       WHERE t."transaction_id" = $1
       GROUP BY t."transaction_id", tt."type_name", u."full_name"`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "المعاملة غير موجودة" });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching transaction for print:", err);
        res.status(500).json({ error: "خطأ في قاعدة البيانات أثناء جلب المعاملة" });
    }
};
