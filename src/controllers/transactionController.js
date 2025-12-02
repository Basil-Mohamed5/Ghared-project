// src/controllers/transactionController.js
import pool from "../config/db.js";

export const getTransactionTypes = async (req, res) => {
    const types = [
        { value: "normal", label: "معاملة عادية" },
        { value: "iqrar", label: "إقرار" }
    ];
    res.json(types);
};

export const createTransaction = async (req, res) => {
    const sender_id = req.user.id;
    const { receiver_id, type = "normal", content, attachments, saveAsDraft } = req.body;

    if (!receiver_id && !saveAsDraft) return res.status(400).json({ error: "receiver_id required" });
    if (!["normal", "iqrar"].includes(type)) return res.status(400).json({ error: "Invalid type" });

    if (saveAsDraft) {
        const draftQ = `INSERT INTO drafts (user_id, content, attachments, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id`;
        const dres = await pool.query(draftQ, [sender_id, JSON.stringify({ receiver_id, type, content, attachments }), attachments || null]);
        return res.status(201).json({ message: "Saved as draft", draftId: dres.rows[0].id });
    }

    const txQ = `INSERT INTO transactions (sender_id, receiver_id, type, content, attachments, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id`;
    const txRes = await pool.query(txQ, [sender_id, receiver_id, type, content, attachments || null]);
    const transactionId = txRes.rows[0].id;

    // notification
    const notifQ = `INSERT INTO notifications (user_id, title, message, transaction_id, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`;
    const title = type === "iqrar" ? "إقرار جديد" : "معاملة جديدة";
    const message = type === "iqrar" ? "لديك إقرار جديد" : "لديك معاملة جديدة";
    await pool.query(notifQ, [receiver_id, title, message, transactionId]);

    res.status(201).json({ message: "Transaction created", transactionId });
};

export const getInbox = async (req, res) => {
    const userId = req.user.id;
    const q = `
    SELECT t.id, t.sender_id, t.type, t.content, t.attachments, t.created_at,
           u.name as sender_name
    FROM transactions t
    JOIN users u ON t.sender_id = u.id
    WHERE t.receiver_id = $1
    ORDER BY t.created_at DESC
  `;
    const result = await pool.query(q, [userId]);
    res.json(result.rows);
};

export const getSent = async (req, res) => {
    const userId = req.user.id;
    const q = `
    SELECT t.id, t.receiver_id, t.type, t.content, t.attachments, t.created_at,
           u.name as receiver_name
    FROM transactions t
    JOIN users u ON t.receiver_id = u.id
    WHERE t.sender_id = $1
    ORDER BY t.created_at DESC
  `;
    const result = await pool.query(q, [userId]);
    res.json(result.rows);
};
