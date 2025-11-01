import express from "express";
import {
  sendTransaction,
  getReceivedTransactions,
  replyToTransaction,
  getTransactionForPrint,
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/send", sendTransaction);
router.get("/received/:userId", getReceivedTransactions);
router.post("/reply", replyToTransaction);
router.get("/:id/print", getTransactionForPrint);

export default router;
