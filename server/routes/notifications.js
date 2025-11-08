import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notifications.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getNotifications);

/* UPDATE */
router.patch("/:notificationId/read", verifyToken, markAsRead);
router.patch("/read-all", verifyToken, markAllAsRead);

/* DELETE */
router.delete("/:notificationId", verifyToken, deleteNotification);

export default router;
