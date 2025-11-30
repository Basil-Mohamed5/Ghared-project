import express from "express";
const router = express.Router();

// ده بس Route تعريفي بسيطة
router.get("/", (req, res) => {
    res.json({
        message: "API Root. Available endpoints:",
        endpoints: [
            "/api/auth",
            "/api/transaction",
            "/api/draft"
        ]
    });
});

export default router;
