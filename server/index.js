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
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";
import { EventEmitter } from 'events';

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
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* FILE STORAGE */
const storage = multer.diskStorage({
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

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
// Accept either an image/video (picture) or audio file
app.post(
  "/posts",
  verifyToken,
  // Accept any file field name to be backward-compatible with clients
  // (we still validate mime types in fileFilter)
  upload.any(),
  createPost
);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use('/analytics', analyticsRoutes);

// SSE endpoint for real-time updates
app.get('/realtime', verifyToken, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const onEvent = (payload) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      // client likely disconnected
    }
  };
  realtimeBus.on('broadcast', onEvent);
  // Initial ping to keep some proxies open
  res.write('data: {"type":"ping"}\n\n');
  req.on('close', () => {
    realtimeBus.off('broadcast', onEvent);
  });
});

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
    let mongoUrl = process.env.MONGO_URL;
    let mem;
    if (!mongoUrl || process.env.NODE_ENV === 'test') {
      console.warn("Using in-memory MongoDB (" + (process.env.NODE_ENV || 'dev') + ")...");
      mem = await MongoMemoryServer.create();
      mongoUrl = mem.getUri();
      process.on("SIGINT", async () => {
        try { if (mem) await mem.stop(); } catch {}
        process.exit(0);
      });
    }
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
    }
    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  } catch (error) {
    console.error("Mongo/Server startup error:", error);
  }
}

startServer();

export default app;
