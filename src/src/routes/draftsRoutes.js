// src/routes/draftsRoutes.js
import express from "express";
import {
    getDrafts,
    getDraftById,
    createDraft,
    deleteDraft,
    sendDraft
} from "../controllers/draftController.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = express.Router();

router.get("/", protect, asyncWrapper(getDrafts));
router.get("/:id", protect, asyncWrapper(getDraftById));
router.post("/", protect, asyncWrapper(createDraft));
router.delete("/:id", protect, asyncWrapper(deleteDraft));
router.post("/:id/send", protect, asyncWrapper(sendDraft));

export default router;
