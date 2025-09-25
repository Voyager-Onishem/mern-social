import express from "express";
import multer from 'multer';
import path from 'path';
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  updateUserProfile,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/:id", verifyToken, getUser);
router.get("/:id/friends", verifyToken, getUserFriends);

/* UPDATE */
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);

// Lightweight storage (duplicate of main config for isolation here)
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'public/assets'); },
  filename: function (req, file, cb) {
    try {
      const ext = path.extname(file.originalname) || '';
      const base = path.basename(file.originalname, ext);
      const safeBase = (base || 'upload').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0,50);
      cb(null, `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}-${safeBase}${ext}`);
    } catch {
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
    }
  }
});
const upload = multer({ storage });

router.patch('/:id', verifyToken, upload.single('picture'), updateUserProfile);

export default router;
