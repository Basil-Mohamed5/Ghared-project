// src/routes/draftRoutes.js
import express from "express";
import {
    createDraft,
    getAllDrafts,
    deleteDraft,
    sendDraft
} from "../controllers/draftController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkSendPermission } from "../middleware/checkRole.js";

const router = express.Router();

router.post("/", protect, createDraft);
router.get("/", protect, getAllDrafts);
router.delete("/:id", protect, deleteDraft);
router.post("/:id/send", protect, checkSendPermission, sendDraft);

export default router;
