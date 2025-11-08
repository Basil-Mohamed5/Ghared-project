import pool from "../config/db.js";

// جلب كل أنواع المعاملات
export const getTransactionTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public."Transaction_Type" ORDER BY type_id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching transaction types:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// إنشاء معاملة جديدة
export const createTransaction = async (req, res) => {
    try {
        const { content, sender_user_id, type_id, subject, code } = req.body;

        if (!content || !sender_user_id || !type_id || !subject || !code) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const insertQuery = `
            INSERT INTO public."Transaction" (content, sender_user_id, type_id, subject, code)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const result = await pool.query(insertQuery, [content, sender_user_id, type_id, subject, code]);

        res.status(201).json({ message: "Transaction created successfully", transaction: result.rows[0] });
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// جلب كل المعاملات
export const getAllTransactions = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public."Transaction" ORDER BY transaction_id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
