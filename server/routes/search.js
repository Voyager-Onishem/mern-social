import express from "express";
import { search } from "../controllers/search.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Search for users and posts
router.get("/", verifyToken, search);

// Test endpoint to check search route authentication
router.get("/test", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Search route is accessible without authentication" 
  });
});

// Test endpoint to check search route authentication
router.get("/test-auth", verifyToken, (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Search authentication is working", 
    userId: req.user?.id || "Unknown" 
  });
});

export default router;