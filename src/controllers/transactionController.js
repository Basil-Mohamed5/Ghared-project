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
    const { receiver_id, type, content, attachments } = req.body;
    const sender_id = 1; // Mock user ID since no auth

    // Validate type
    if (!['normal', 'iqrar'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
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
