import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import transactionRoutes from "./routes/transactionRoutes.js";
import draftsRoutes from "./routes/draftsRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/drafts", draftsRoutes);

// Generic error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

export default app;
