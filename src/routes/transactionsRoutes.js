// src/routes/transactionRoutes.js
import express from "express";
import {
    getTransactionTypes,
    createTransaction,
    getAllTransactions,
    sendTransaction,
    getReceivedTransactions,
    replyToTransaction,
    getTransactionForPrint
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkSendPermission } from "../middleware/checkRole.js";

const router = express.Router();

router.get("/types", protect, getTransactionTypes);
router.post("/", protect, createTransaction);
router.get("/", protect, getAllTransactions);

// protected endpoints
router.post("/send", protect, checkSendPermission, sendTransaction);
router.get("/received/:userId", protect, getReceivedTransactions);
router.post("/reply", protect, checkSendPermission, replyToTransaction);
router.get("/:id/print", protect, getTransactionForPrint);

export default router;
