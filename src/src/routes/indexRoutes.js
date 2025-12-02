// src/routes/indexRoutes.js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        message: "API is running",
        endpoints: ["/api/auth", "/api/transaction", "/api/draft"]
    });
});

export default router;
