// src/controllers/draftController.js
import pool from "../config/db.js";

export const createDraft = async (req, res) => {
    try {
        const { transaction_id, archived_by_user_id, storage_path } = req.body;
        if (!transaction_id || !archived_by_user_id || !storage_path) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        // Check if transaction exists
        const transactionCheck = await pool.query(
            `SELECT transaction_id FROM public."Transaction" WHERE transaction_id = $1`,
            [transaction_id]
        );
        if (transactionCheck.rows.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        const result = await pool.query(
            `INSERT INTO public."Draft" (transaction_id, archived_by_user_id, archive_date, storage_path)
       VALUES ($1, $2, NOW(), $3) RETURNING *`,
            [transaction_id, archived_by_user_id, storage_path]
        );
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(201).json({ message: "Draft created successfully", draft: result.rows[0] });
    } catch (error) {
        console.error("Error creating draft:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

export const getAllDrafts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public."Draft" ORDER BY draft_id ASC');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching drafts:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

export const deleteDraft = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM public."Draft" WHERE draft_id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Draft not found" });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json({ message: "Draft deleted successfully" });
    } catch (error) {
        console.error("Error deleting draft:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

export const sendDraft = async (req, res) => {
    const { id } = req.params;
    try {
        const draftResult = await pool.query('SELECT * FROM public."Draft" WHERE draft_id = $1', [id]);
        const draft = draftResult.rows[0];
        if (!draft) return res.status(404).json({ message: "Draft not found" });

        const transactionResult = await pool.query('SELECT * FROM public."Transaction" WHERE transaction_id = $1', [draft.transaction_id]);
        const originalTransaction = transactionResult.rows[0];
        if (!originalTransaction) return res.status(404).json({ message: "Original transaction not found" });

        const newTransactionResult = await pool.query(
            `INSERT INTO public."Transaction" (content, sender_user_id, type_id, subject, code, date, current_status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'active') RETURNING *`,
            [originalTransaction.content, originalTransaction.sender_user_id, originalTransaction.type_id, originalTransaction.subject, originalTransaction.code]
        );

        await pool.query('DELETE FROM public."Draft" WHERE draft_id = $1', [id]);

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json({ message: "Draft sent successfully and converted to a new transaction", transaction: newTransactionResult.rows[0] });
    } catch (error) {
        console.error("Error sending draft:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
