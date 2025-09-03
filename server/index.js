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
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
export const app = express();
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
// Accept common images and web-friendly video formats
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10);
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype || "";
    const allowed = mime.startsWith("image/") ||
      mime === "video/mp4" ||
      mime === "video/webm" ||
      mime === "video/ogg";
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
app.post("/posts", verifyToken, upload.single("picture"), createPost);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

// Multer/Upload error handler
app.use((err, req, res, next) => {
  if (err && (err.code === "LIMIT_FILE_SIZE" || err.code === "INVALID_FILE_TYPE")) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: `File too large. Max ${MAX_FILE_SIZE_MB}MB` });
    }
    if (err.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({ message: "Invalid file type. Only images and MP4/WebM/OGG videos are allowed." });
    }
  }
  next(err);
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

      /* ADD DATA ONE TIME */
      // User.insertMany(users);
      // Post.insertMany(posts);
    })
    .catch((error) => console.log(`${error} did not connect`));
}

export default app;
