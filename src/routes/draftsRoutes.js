import express from "express";
import { getDrafts, deleteDraft, sendDraft } from "../controllers/draftController.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = express.Router();

// Get All Drafts
router.get("/", protect, asyncWrapper(getDrafts));

// Delete Draft
router.delete("/:id", protect, asyncWrapper(deleteDraft));

// Send Draft
router.post("/:id/send", protect, asyncWrapper(sendDraft));

export default router;
