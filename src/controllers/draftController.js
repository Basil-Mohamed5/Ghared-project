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
    const { receiver_id, type } = req.body; // receiver_id and type from request
    const userId = req.user.id;

    // Get draft
    const [drafts] = await pool.execute('SELECT * FROM drafts WHERE id = ? AND user_id = ?', [id, userId]);
    if (drafts.length === 0) {
        return res.status(404).json({ error: 'Draft not found' });
    }
    const draft = drafts[0];

    // Validate type
    if (!['normal', 'iqrar'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Insert transaction
    const transactionQuery = `
        INSERT INTO transactions (sender_id, receiver_id, type, content, attachments)
        VALUES (?, ?, ?, ?, ?)
    `;
    const [transactionResult] = await pool.execute(transactionQuery, [userId, receiver_id, type, draft.content, draft.attachments]);
    const transactionId = transactionResult.insertId;

    // Insert notification
    const notificationQuery = `
        INSERT INTO notifications (user_id, title, message, transaction_id)
        VALUES (?, ?, ?, ?)
    `;
    const title = type === 'iqrar' ? 'إقرار جديد' : 'معاملة جديدة';
    const message = `لديك ${type === 'iqrar' ? 'إقرار' : 'معاملة'} جديدة`;
    await pool.execute(notificationQuery, [receiver_id, title, message, transactionId]);

    // Delete draft
    await pool.execute('DELETE FROM drafts WHERE id = ?', [id]);

    res.json({ message: 'Draft sent as transaction', transactionId });
};
