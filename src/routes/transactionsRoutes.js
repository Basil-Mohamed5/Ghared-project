import express from "express";
import { getTransactionTypes, createTransaction, getAllTransactions } from "../controllers/transactionController.js";

const router = express.Router();

router.get("/types", getTransactionTypes);       // GET جميع أنواع المعاملات
router.post("/", createTransaction);             // POST إنشاء معاملة جديدة
router.get("/", getAllTransactions);            // GET كل المعاملات

export default router;
