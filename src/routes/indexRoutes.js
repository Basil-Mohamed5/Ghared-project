import express from "express";

const router = express.Router();

// Health check
router.get("/", (req, res) => {
    res.json({ message: "API is running" });
});

export default router;
