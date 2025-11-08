import express from "express";
import {
  sendTransaction,
  getReceivedTransactions,
  replyToTransaction,
  getTransactionForPrint,
  getTransactionTypes,
  createTransaction,
  getAllTransactions
} from "../controllers/transactionController.js";

const router = express.Router();

// ----------------------------------------
// Transaction Types & CRUD
// ----------------------------------------
router.get("/types", getTransactionTypes);       // GET جميع أنواع المعاملات
router.post("/", createTransaction);             // POST إنشاء معاملة جديدة
router.get("/", getAllTransactions);            // GET كل المعاملات

// ----------------------------------------
// Transaction Actions (Send, Receive, Reply, Print)
// ----------------------------------------
router.post("/send", sendTransaction);                   // إرسال معاملة جديدة
router.get("/received/:userId", getReceivedTransactions); // جلب المعاملات المستلمة
router.post("/reply", replyToTransaction);              // الرد على معاملة
router.get("/:id/print", getTransactionForPrint);       // جلب بيانات المعاملة للطباعة

export default router;
