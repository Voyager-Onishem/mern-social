import express from "express";
import { login } from "../controllers/auth.js";

const router = express.Router();

router.post("/login", login);

// Simple test endpoint for connection diagnostics
router.get("/test", (req, res) => {
  res.status(200).json({ status: "ok", message: "API server is running" });
});

export default router;
