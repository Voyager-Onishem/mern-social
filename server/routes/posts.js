import express from "express";
import { getFeedPosts, getUserPosts, likePost, addComment, getPost, editComment, deleteComment } from "../controllers/posts.js";
import { purgeAudioPosts } from "../controllers/posts.js";
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
// Edit a comment
router.patch("/:id/comment/edit", verifyToken, editComment);
// Delete a comment
router.patch("/:id/comment/delete", verifyToken, deleteComment);

// Maintenance endpoint to purge all audio posts
router.delete("/purge-audio", verifyToken, purgeAudioPosts);

export default router;
