// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        // decoded should contain at least { id, role }
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Auth error:", err);
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
