import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createUser, findUserByEmail } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// تسجيل مستخدم جديد
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const exists = await findUserByEmail(email);
        if (exists) return res.status(400).json({ message: "Email already exists" });

        const user = await createUser(name, email, password, role);
        res.status(201).json({ message: "Registered successfully", user });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: err.message });
    }
};

// تسجيل الدخول
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ message: "Email and password required" });

        const user = await findUserByEmail(email);
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(400).json({ message: "Invalid email or password" });

        // إنشاء JWT
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ message: "Login successful", token });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
    }
};
