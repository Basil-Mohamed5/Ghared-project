// src/index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pool from "./config/db.js";

// Routes
import indexRoutes from "./routes/indexRoutes.js";
import transactionsRoutes from "./routes/transactionRoutes.js";
import draftRoutes from "./routes/draftsRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api", indexRoutes);
app.use("/api/transaction", transactionsRoutes);
app.use("/api/draft", draftRoutes);

// Test DB route (optional)
app.get("/test-db", async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT NOW() as now');
        res.json({ now: rows[0].now });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generic error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: err.message
        });
    } else {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: "Internal Server Error"
        });
    }
});

// Start
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
