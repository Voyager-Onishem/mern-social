import express from "express";
import { getFeedPosts, getUserPosts, likePost, addComment, getPost } from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/:userId/posts", verifyToken, getUserPosts);
// Get a single post (including comments)
router.get("/:id", verifyToken, getPost);

/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);

// Add comment to a post
router.patch("/:id/comment", verifyToken, addComment);

export default router;
