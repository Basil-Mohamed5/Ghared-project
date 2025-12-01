import express from "express";
import { createTransaction, getTransactionTypes, getInbox, getSent } from "../controllers/transactionController.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = express.Router();

// Get Transaction Types
router.get("/types", asyncWrapper(getTransactionTypes));

// Create Transaction
router.post("/", asyncWrapper(createTransaction));

// Get Inbox (Received Transactions)
router.get("/inbox", asyncWrapper(getInbox));

// Get Sent Transactions
router.get("/sent", asyncWrapper(getSent));

export default router;
