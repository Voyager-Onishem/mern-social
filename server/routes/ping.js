import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { database } from "../services/database.js";

const router = express.Router();

// Simple ping endpoint for connection checks
router.get("/ping", verifyToken, (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Health check endpoint with database status
router.get("/health", (req, res) => {
  const dbStatus = database.getStatus();
  const isHealthy = database.isReady();
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isConnected,
      type: dbStatus.connectionType,
      state: dbStatus.stateText,
      environment: dbStatus.nodeEnv
    },
    warnings: dbStatus.connectionType === 'memory' ? [
      'Using in-memory database - data will be lost on restart'
    ] : []
  });
});

// Detailed status endpoint (admin only)
router.get("/status", verifyToken, (req, res) => {
  const dbStatus = database.getStatus();
  
  res.status(200).json({
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    },
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;