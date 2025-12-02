// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        // expected decoded: { id, email?, role?, ... }
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Auth error:", err.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
