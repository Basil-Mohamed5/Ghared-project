import express from "express";
import {
  sendTransaction,
  getSentTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/send", sendTransaction);
router.get("/sent/:userId", getSentTransactions);

export default router;
