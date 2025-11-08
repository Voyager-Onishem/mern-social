import Notification from "../models/Notification.js";
import { getIO } from "../config/socket.js";

/* READ */
export const getNotifications = async (req, res) => {
  try {
    const { id } = req.user; // From verifyToken middleware
    const { limit = 20, skip = 0 } = req.query;

    const notifications = await Notification.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const unreadCount = await Notification.countDocuments({ 
      userId: id, 
      read: false 
    });

    res.status(200).json({ 
      notifications, 
      unreadCount 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.user;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { id } = req.user;

    await Notification.updateMany(
      { userId: id, read: false },
      { read: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.user;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UTILITY - Create and emit notification */
export const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();

    // Emit real-time notification via Socket.io
    const io = getIO();
    io.to(notificationData.userId).emit('notification', notification);

    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
};
