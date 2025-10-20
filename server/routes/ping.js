import express from "express";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Simple ping endpoint for connection checks
router.get("/ping", verifyToken, (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default router;