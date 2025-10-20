import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { MongoMemoryServer } from "mongodb-memory-server";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import analyticsRoutes from "./routes/analytics.js";
import searchRoutes from "./routes/search.js";
import videosRoutes from "./routes/videos.js";
import pingRoutes from "./routes/ping.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";
import { EventEmitter } from 'events';
import { cloudStorageConfig, getPublicUrl } from './config/cloudStorage.js';

// Simple event bus for real-time notifications (SSE broadcast)
export const realtimeBus = new EventEmitter();

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
export const app = express();
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev-secret-change-me";
  console.warn("JWT_SECRET not set. Using insecure development secret. Set JWT_SECRET in .env for production.");
}
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

// Configure static file serving with proper cache control - only used when not using cloud storage
app.use("/assets", express.static(path.join(__dirname, "public/assets"), {
  setHeaders: (res, path) => {
    // Check if the file is a video
    if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.mov')) {
      // For video files, set appropriate headers
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
    } else {
      // For other assets
      res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days cache
    }
  }
}));

/* FILE STORAGE */
// Determine whether to use cloud storage or local storage
const useCloudStorage = process.env.USE_CLOUD_STORAGE === 'true';

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    // Create a unique, safe filename to avoid collisions
    try {
      const ext = path.extname(file.originalname) || '';
      const base = path.basename(file.originalname, ext);
      const safeBase = (base || 'upload')
        .toString()
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .slice(0, 50);
      const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      cb(null, `${safeBase}-${unique}${ext}`);
    } catch (e) {
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    }
  },
});

// Use the appropriate storage based on configuration
const storage = useCloudStorage ? cloudStorageConfig : localStorage;

// Accept common images, web-friendly video formats, and audio formats
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10);
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype || "";
    const allowed = mime.startsWith("image/") ||
      mime === "video/mp4" || mime === "video/webm" || mime === "video/ogg" ||
      mime.startsWith("audio/") ||
      ["audio/webm","audio/ogg","audio/mpeg","audio/wav","audio/mp4"].includes(mime);
    if (!allowed) {
      const err = new Error("INVALID_FILE_TYPE");
      err.code = "INVALID_FILE_TYPE";
      return cb(err);
    }
    cb(null, true);
  },
});

// Middleware to process uploaded files and extract URLs for cloud storage
export const processUploadedFiles = (req, res, next) => {
  if (!useCloudStorage) {
    // For local storage, we continue with the current approach
    return next();
  }
  
  // For cloud storage, we need to extract URLs from the uploaded files
  if (req.file) {
    // Single file upload
    req.file.filename = getPublicUrl(req.file);
  }
  
  if (req.files && Array.isArray(req.files)) {
    // Multiple files upload
    req.files.forEach(file => {
      file.filename = getPublicUrl(file);
    });
  }
  
  next();
};

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), processUploadedFiles, register);
// Accept either an image/video (picture) or audio file
app.post(
  "/posts",
  verifyToken,
  // Accept any file field name to be backward-compatible with clients
  // (we still validate mime types in fileFilter)
  upload.any(),
  processUploadedFiles,
  createPost
);

/* ROUTES */
// Root endpoint for API connection test
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "API server is running" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/search', searchRoutes);
app.use('/videos', videosRoutes);
app.use('/auth', pingRoutes); // Add ping endpoint under /auth/ping