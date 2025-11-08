import express from "express";
import {
    createDraft,
    getAllDrafts,
    deleteDraft,
    sendDraft
} from "../controllers/draftController.js";

const router = express.Router();

router.post("/", createDraft);
router.get("/", getAllDrafts);
router.delete("/:id", deleteDraft);
router.post("/:id/send", sendDraft);

export default router;
