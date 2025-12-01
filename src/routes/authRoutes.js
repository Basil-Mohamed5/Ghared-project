import express from "express";
import { register, login } from "../controllers/authController.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = express.Router();

// Register
router.post("/register", asyncWrapper(register));

// Login
router.post("/login", asyncWrapper(login));

export default router;
