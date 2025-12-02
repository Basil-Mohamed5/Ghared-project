// src/controllers/draftController.js
import pool from "../config/db.js";

export const getDrafts = async (req, res) => {
    const userId = req.user.id;
    const q = `SELECT id, content, attachments, created_at FROM drafts WHERE user_id = $1 ORDER BY created_at DESC`;
    const result = await pool.query(q, [userId]);
    res.json(result.rows);
};

export const getDraftById = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const q = `SELECT id, content, attachments, created_at FROM drafts WHERE id = $1 AND user_id = $2`;
    const result = await pool.query(q, [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Draft not found" });
    res.json(result.rows[0]);
};

export const createDraft = async (req, res) => {
    const userId = req.user.id;
    const { content, attachments } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const q = `INSERT INTO drafts (user_id, content, attachments, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id`;
    const result = await pool.query(q, [userId, content, attachments || null]);
    res.status(201).json({ message: "Draft created", draftId: result.rows[0].id });
};

export const deleteDraft = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const q = `DELETE FROM drafts WHERE id = $1 AND user_id = $2 RETURNING id`;
    const result = await pool.query(q, [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Draft not found" });
    res.json({ message: "Draft deleted" });
};

export const sendDraft = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    // 1) get draft
    const draftRes = await pool.query(`SELECT * FROM drafts WHERE id = $1 AND user_id = $2`, [id, userId]);
    if (draftRes.rows.length === 0) return res.status(404).json({ error: "Draft not found" });
    const draft = draftRes.rows[0];

    // 2) draft.content might be JSON (transaction data) or plain text
    let transactionData = {};
    try { transactionData = JSON.parse(draft.content); } catch (e) { transactionData = { content: draft.content, attachments: draft.attachments }; }

    const receiver_id = transactionData.receiver_id || req.body.receiver_id;
    const type = transactionData.type || req.body.type || "normal";
    const content = transactionData.content || req.body.content || "";
    const attachments = transactionData.attachments || draft.attachments || null;

    // Validate simple
    if (!receiver_id) return res.status(400).json({ error: "receiver_id required to send draft" });
    if (!["normal", "iqrar"].includes(type)) return res.status(400).json({ error: "Invalid type" });

    // 3) create transaction
    const insertTx = `
    INSERT INTO transactions (sender_id, receiver_id, type, content, attachments, created_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id
  `;
    const txRes = await pool.query(insertTx, [userId, receiver_id, type, content, attachments]);
    const transactionId = txRes.rows[0].id;

    // 4) notifications - simple insert
    const notifQ = `INSERT INTO notifications (user_id, title, message, transaction_id, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`;
    const title = type === "iqrar" ? "إقرار جديد" : "معاملة جديدة";
    const message = type === "iqrar" ? "لديك إقرار جديد" : "لديك معاملة جديدة";
    await pool.query(notifQ, [receiver_id, title, message, transactionId]);

    // 5) delete draft
    await pool.query(`DELETE FROM drafts WHERE id = $1`, [id]);

    res.json({ message: "Draft sent as transaction", transactionId });
};
