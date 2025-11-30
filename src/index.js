// src/index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pool from "./config/db.js";

// Routes
import indexRoutes from "./routes/indexRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import transactionsRoutes from "./routes/transactionsRoutes.js";
import draftRoutes from "./routes/draftsRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api", indexRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/transaction", transactionsRoutes);
app.use("/api/draft", draftRoutes);

// Test DB route (optional)
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ now: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generic error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

// Start
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
