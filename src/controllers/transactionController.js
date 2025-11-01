import { pool } from "../config/db.js";

/* --------------------------------------------------
  إرسال معاملة جديدة (Transaction Send)
-------------------------------------------------- */
export const sendTransaction = async (req, res) => {
  const {
    sender_user_id,
    type_id,
    subject,
    content,
    receiver_user_id,
    receiver_user_ids,
    date,
    current_status = "sent",
    code = null,
    parent_transaction_id = null,
  } = req.body;

  if (
    !sender_user_id ||
    !type_id ||
    !content ||
    (!receiver_user_id && !receiver_user_ids)
  ) {
    return res.status(400).json({
      error:
        "Required fields: sender_user_id, type_id, content and receiver_user_id(s)",
    });
  }

  const receivers = Array.isArray(receiver_user_ids)
    ? receiver_user_ids
    : receiver_user_id
    ? [receiver_user_id]
    : [];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // إدخال المعاملة
    const trRes = await client.query(
      `
      INSERT INTO "Transaction"
        ("content", "sender_user_id", "type_id", "parent_transaction_id", "current_status", "code", "date", "subject")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING "transaction_id"
    `,
      [
        content,
        sender_user_id,
        type_id,
        parent_transaction_id,
        current_status,
        code,
        date || new Date().toISOString().slice(0, 10),
        subject || null,
      ]
    );

    const transactionId = trRes.rows[0].transaction_id;

    // إدخال المستلمين
    for (const rid of receivers) {
      await client.query(
        `INSERT INTO "Transaction_Receiver" ("transaction_id", "receiver_user_id") VALUES ($1, $2)`,
        [transactionId, rid]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Transaction sent successfully",
      transaction_id: transactionId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error sending transaction:", err);
    res.status(500).json({ error: "Database error while sending transaction" });
  } finally {
    client.release();
  }
};

/* --------------------------------------------------
   عرض المعاملات المستلمة (Received)
-------------------------------------------------- */
export const getReceivedTransactions = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        t."transaction_id",
        t."subject",
        t."content",
        t."date",
        t."current_status",
        tt."type_name",
        u."full_name" AS sender_name
      FROM "Transaction" t
      JOIN "Transaction_Type" tt ON t."type_id" = tt."type_id"
      JOIN "User" u ON t."sender_user_id" = u."user_id"
      JOIN "Transaction_Receiver" tr ON t."transaction_id" = tr."transaction_id"
      WHERE tr."receiver_user_id" = $1
      ORDER BY t."date" DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching received transactions:", err);
    res
      .status(500)
      .json({ error: "Database error while fetching received transactions" });
  }
};

/* --------------------------------------------------
   الرد على معاملة (Reply)
-------------------------------------------------- */
export const replyToTransaction = async (req, res) => {
  const { sender_user_id, parent_transaction_id, subject, content } = req.body;

  try {
    const receivers = await pool.query(
      `SELECT receiver_user_id FROM "Transaction_Receiver" WHERE transaction_id = $1`,
      [parent_transaction_id]
    );

    if (receivers.rows.length === 0)
      return res
        .status(404)
        .json({ error: "No receivers found for the parent transaction." });

    const newTransaction = await pool.query(
      `
      INSERT INTO "Transaction" 
        ("subject", "content", "sender_user_id", "date", "current_status", "type_id", "parent_transaction_id")
      VALUES ($1, $2, $3, CURRENT_DATE, 'sent', 1, $4)
      RETURNING transaction_id
      `,
      [subject, content, sender_user_id, parent_transaction_id]
    );

    const newTransactionId = newTransaction.rows[0].transaction_id;

    for (const row of receivers.rows) {
      if (row.receiver_user_id !== sender_user_id) {
        await pool.query(
          `
          INSERT INTO "Transaction_Receiver" ("transaction_id", "receiver_user_id")
          VALUES ($1, $2)
          `,
          [newTransactionId, row.receiver_user_id]
        );
      }
    }

    res.status(201).json({
      message: "Reply sent successfully.",
      reply_transaction_id: newTransactionId,
    });
  } catch (err) {
    console.error("❌ Error sending reply:", err);
    res.status(500).json({ error: "Database error while sending reply." });
  }
};

/* --------------------------------------------------
  تجهيز بيانات المعاملة للطباعة (Print Data)
------------------------------------------------- */
export const getTransactionForPrint = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT 
        t."transaction_id",
        t."subject",
        t."content",
        t."date",
        t."current_status",
        tt."type_name",
        u."full_name" AS sender_name,
        ARRAY_AGG(tr."receiver_user_id") AS receivers
      FROM "Transaction" t
      JOIN "Transaction_Type" tt ON t."type_id" = tt."type_id"
      JOIN "User" u ON t."sender_user_id" = u."user_id"
 
      LEFT JOIN "Transaction_Receiver" tr ON t."transaction_id" = tr."transaction_id"
      WHERE t."transaction_id" = $1
      GROUP BY t."transaction_id", tt."type_name", u."full_name"
      `,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Transaction not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching transaction for print:", err);
    res
      .status(500)
      .json({ error: "Database error while fetching transaction" });
  }
};
