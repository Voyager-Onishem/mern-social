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
import { createServer } from "http";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import analyticsRoutes from "./routes/analytics.js";
import searchRoutes from "./routes/search.js";
import videosRoutes from "./routes/videos.js";
import pingRoutes from "./routes/ping.js";
import cloudinaryRoutes from "./routes/cloudinary.js";
import notificationRoutes from "./routes/notifications.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";
import { cloudStorageConfig } from './config/cloudStorage.js';
import { mediaStorage, getPublicUrl } from './services/mediaStorage.js';
import { initializeSocket } from './config/socket.js';
import { database } from './services/database.js';

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
export const app = express();
const httpServer = createServer(app);
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
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:3002"
  ],
  credentials: true
}));

// Determine whether to use cloud storage or local storage
const useCloudStorage = mediaStorage.isCloudStorage();

// Log which storage system we're using
console.log(`Using ${mediaStorage.getStorageType()} storage (${useCloudStorage ? 'Cloudinary' : 'local files'})`);
console.log('Storage info:', mediaStorage.getStorageInfo());

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
  // Process uploaded files using the unified media storage service
  if (req.file) {
    // Single file upload
    const processed = mediaStorage.processUploadedFile(req.file);
    req.file.filename = processed.url;
  }
  
  if (req.files && Array.isArray(req.files)) {
    // Multiple files upload
    const processed = mediaStorage.processUploadedFiles(req.files);
    req.files.forEach((file, index) => {
      file.filename = processed[index].url;
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
app.use('/notifications', notificationRoutes);
app.use('/auth', pingRoutes); // Add ping endpoint under /auth/ping
app.use('/cloudinary', cloudinaryRoutes); // Add cloudinary test endpoints

// Multer/Upload error handler
app.use((err, req, res, next) => {
  if (err && (err.code === "LIMIT_FILE_SIZE" || err.code === "INVALID_FILE_TYPE" || err.code === 'LIMIT_UNEXPECTED_FILE')) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: `File too large. Max ${MAX_FILE_SIZE_MB}MB` });
    }
    if (err.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({ message: "Invalid file type. Only images, audio, and MP4/WebM/OGG videos are allowed." });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: "Unexpected file field. Try again or update the app." });
    }
  }
  next(err);
});

// Global JSON error handler (prevents HTML error pages)
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
async function startServer() {
  try {
    // Connect to database using the new service
    // In development: allows fallback to local/memory if Atlas unavailable
    // In production: strict mode, requires Atlas connection
    const connectionType = await database.connect({
      allowFallback: process.env.NODE_ENV !== 'production', // Only allow fallback in development
      timeout: 10000 // 10 seconds timeout
    });

    // Log connection status
    const status = database.getStatus();
    console.log('Database Status:', {
      environment: status.nodeEnv,
      connectionType: status.connectionType,
      state: status.stateText
    });

    // Warn if using in-memory database
    if (connectionType === 'memory') {
      console.warn('⚠️  WARNING: Using in-memory database. All data will be lost on server restart!');
      console.warn('⚠️  To use persistent storage, configure MONGO_URL in .env or run local MongoDB.');
    }
    
    // Initialize Socket.io
    const io = initializeSocket(httpServer);
    console.log("Socket.io initialized successfully");
    
    // Start HTTP server (skip in test mode)
    if (process.env.NODE_ENV !== 'test') {
      httpServer.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
        console.log(`Database: ${connectionType}`);
      });
    }

    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    console.error("Full error:", error);
    process.exit(1); // Exit with error code in production
  }
}

startServer();

export default app;