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
    عرض المعاملات الصادرة (Sent)
-------------------------------------------------- */
export const getSentTransactions = async (req, res) => {
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
        ARRAY_AGG(tr."receiver_user_id") AS receivers
      FROM "Transaction" t
      JOIN "Transaction_Type" tt ON t."type_id" = tt."type_id"
      LEFT JOIN "Transaction_Receiver" tr ON t."transaction_id" = tr."transaction_id"
      WHERE t."sender_user_id" = $1
      GROUP BY t."transaction_id", tt."type_name"
      ORDER BY t."date" DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching sent transactions:", err);
    res
      .status(500)
      .json({ error: "Database error while fetching sent transactions" });
  }
};
