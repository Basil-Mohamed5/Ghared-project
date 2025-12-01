import pool from "../config/db.js";

// Get Transaction Types
export const getTransactionTypes = async (req, res) => {
    const types = [
        { value: 'normal', label: 'معاملة عادية' },
        { value: 'iqrar', label: 'إقرار' }
    ];
    res.json(types);
};

// Create Transaction
export const createTransaction = async (req, res) => {
    const { receiver_id, type, content, attachments, saveAsDraft } = req.body;
    const sender_id = 1; // Mock user ID since no auth

    // Validate type
    if (!['normal', 'iqrar'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
    }

    if (saveAsDraft) {
        // Save as draft
        const draftContent = JSON.stringify({ receiver_id, type, content, attachments });
        const draftQuery = `
            INSERT INTO drafts (user_id, content, attachments)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        const draftResult = await pool.query(draftQuery, [sender_id, draftContent, null]);
        return res.status(201).json({ message: 'Transaction saved as draft', draftId: draftResult.rows[0].id });
    }

    // Insert transaction
    const transactionQuery = `
        INSERT INTO transactions (sender_id, receiver_id, type, content, attachments)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;
    const transactionResult = await pool.query(transactionQuery, [sender_id, receiver_id, type, content, attachments || null]);
    const transactionId = transactionResult.rows[0].id;

    // Insert notification
    const notificationQuery = `
        INSERT INTO notifications (user_id, title, message, transaction_id)
        VALUES ($1, $2, $3, $4)
    `;
    const title = type === 'iqrar' ? 'إقرار جديد' : 'معاملة جديدة';
    const message = `لديك ${type === 'iqrar' ? 'إقرار' : 'معاملة'} جديدة`;
    await pool.query(notificationQuery, [receiver_id, title, message, transactionId]);

    res.status(201).json({ message: 'Transaction created successfully', transactionId });
};

// Get Inbox (Received Transactions)
export const getInbox = async (req, res) => {
    const userId = 1; // Mock user ID since no auth

    const query = `
        SELECT t.id, t.sender_id, t.type, t.content, t.attachments, t.timestamp,
               u.name as sender_name
        FROM transactions t
        JOIN users u ON t.sender_id = u.id
        WHERE t.receiver_id = $1
        ORDER BY t.timestamp DESC
    `;
    const result = await pool.query(query, [userId]);

    res.json(result.rows);
};

// Get Sent Transactions
export const getSent = async (req, res) => {
    const userId = 1; // Mock user ID since no auth

    const query = `
        SELECT t.id, t.receiver_id, t.type, t.content, t.attachments, t.timestamp,
               u.name as receiver_name
        FROM transactions t
        JOIN users u ON t.receiver_id = u.id
        WHERE t.sender_id = $1
        ORDER BY t.timestamp DESC
    `;
    const result = await pool.query(query, [userId]);

    res.json(result.rows);
};
