import express from "express";
import { createTransaction, getTransactionTypes } from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = express.Router();

// Get Transaction Types
router.get("/types", protect, asyncWrapper(getTransactionTypes));

// Create Transaction
router.post("/", protect, asyncWrapper(createTransaction));

export default router;
