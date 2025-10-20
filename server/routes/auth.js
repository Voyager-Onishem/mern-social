import express from "express";
import { login } from "../controllers/auth.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);

// Simple test endpoint for connection diagnostics
// Adding a public test endpoint (no auth required) and a protected one
router.get("/test", (req, res) => {
  res.status(200).json({ status: "ok", message: "API server is running" });
});

// Protected test endpoint
router.get("/test-auth", verifyToken, (req, res) => {
  res.status(200).json({ status: "ok", message: "Authentication is working", userId: req.user.id });
});

export default router;
