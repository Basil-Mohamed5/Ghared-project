// src/middleware/permissionMiddleware.js
import pool from "../config/db.js";

/*
  Usage: import { checkPermission } from '...';
  router.post('/', protect, checkPermission, handler)
  This middleware reads req.body.receiver_id and req.user.id
*/

export const checkPermission = async (req, res, next) => {
    try {
        const sender_id = req.user.id;
        const receiver_id = req.body.receiver_id;

        if (!receiver_id) {
            return res.status(400).json({ error: "Missing receiver_id" });
        }

        const q = `SELECT id, level, department FROM users WHERE id = $1 OR id = $2`;
        const result = await pool.query(q, [sender_id, receiver_id]);

        if (result.rows.length < 2) {
            return res.status(400).json({ error: "Invalid sender or receiver" });
        }

        const sender = result.rows.find(r => r.id === Number(sender_id));
        const receiver = result.rows.find(r => r.id === Number(receiver_id));

        if (!sender || !receiver) return res.status(400).json({ error: "Invalid sender or receiver" });

        // Permission logic:
        // Level 1: university level (includes dean) => can send to level1 or level2
        // Level 2: college departments => can send to level2 peers or dean (level1 but specifically 'عميد' department or role)
        if (sender.level === 1) {
            // ok (can send to 1 or 2)
            if (![1, 2].includes(receiver.level)) {
                return res.status(403).json({ error: "Unauthorized: cannot send to this level" });
            }
        } else if (sender.level === 2) {
            // can send to level2 peers or dean (we check receiver.level===2 or receiver.department === 'عميد' OR receiver.role === 'dean')
            const isDean = receiver.department === "عميد" || receiver.role === "dean" || receiver.level === 1 && (receiver.department === "عميد" || receiver.role === "dean");
            if (receiver.level !== 2 && !isDean) {
                return res.status(403).json({ error: "Unauthorized: can only send to level2 peers or dean" });
            }
        } else {
            // other levels: deny by default
            return res.status(403).json({ error: "Unauthorized: your level cannot send transactions" });
        }

        next();
    } catch (err) {
        console.error("Permission middleware error:", err);
        res.status(500).json({ error: "Permission check failed" });
    }
};
