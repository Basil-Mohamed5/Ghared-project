// src/app.js
import express from "express";
import cors from "cors";
import transactionRoutes from "./routes/transactionRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/transactions", transactionRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Server is running and ready!");
});

export default app;
