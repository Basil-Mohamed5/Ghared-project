import pool from "../config/db.js";

// Get All Drafts for User
export const getDrafts = async (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT id, content, attachments, timestamp
        FROM drafts
        WHERE user_id = ?
        ORDER BY timestamp DESC
    `;
    const [rows] = await pool.execute(query, [userId]);

    res.json(rows);
};

// Delete Draft
export const deleteDraft = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const query = 'DELETE FROM drafts WHERE id = ? AND user_id = ?';
    const [result] = await pool.execute(query, [id, userId]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Draft not found' });
    }

    res.json({ message: 'Draft deleted' });
};

// Send Draft (Convert to Transaction)
export const sendDraft = async (req, res) => {
    const { id } = req.params;
    const userId = 1; // Mock user ID since no auth

    // Get draft
    const draftQuery = 'SELECT * FROM drafts WHERE id = $1 AND user_id = $2';
    const draftResult = await pool.query(draftQuery, [id, userId]);
    if (draftResult.rows.length === 0) {
        return res.status(404).json({ error: 'Draft not found' });
    }
    const draft = draftResult.rows[0];

    let transactionData;
    try {
        transactionData = JSON.parse(draft.content);
    } catch (error) {
        // If not JSON, treat as regular draft content
        transactionData = { content: draft.content, attachments: draft.attachments };
    }

    const { receiver_id, type, content, attachments } = transactionData;

    // Validate type if provided
    if (type && !['normal', 'iqrar'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Insert transaction
    const transactionQuery = `
        INSERT INTO transactions (sender_id, receiver_id, type, content, attachments)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;
    const transactionResult = await pool.query(transactionQuery, [userId, receiver_id, type || 'normal', content, attachments || null]);
    const transactionId = transactionResult.rows[0].id;

    // Insert notification
    const notificationQuery = `
        INSERT INTO notifications (user_id, title, message, transaction_id)
        VALUES ($1, $2, $3, $4)
    `;
    const title = type === 'iqrar' ? 'إقرار جديد' : 'معاملة جديدة';
    const message = `لديك ${type === 'iqrar' ? 'إقرار' : 'معاملة'} جديدة`;
    await pool.query(notificationQuery, [receiver_id, title, message, transactionId]);

    // Delete draft
    await pool.query('DELETE FROM drafts WHERE id = $1', [id]);

    res.json({ message: 'Draft sent as transaction', transactionId });
};
