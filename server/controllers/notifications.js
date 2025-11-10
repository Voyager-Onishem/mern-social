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
    // Check for existing similar notification to prevent duplicates
    // Look for notifications of the same type, from the same user, to the same user, about the same post
    // within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const existingNotification = await Notification.findOne({
      userId: notificationData.userId,
      type: notificationData.type,
      fromUserId: notificationData.fromUserId,
      postId: notificationData.postId,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (existingNotification) {
      // Don't create duplicate notification, just return the existing one
      console.log('🚫 Preventing duplicate notification:', {
        type: notificationData.type,
        from: notificationData.fromUserId,
        to: notificationData.userId,
        existing: existingNotification._id
      });
      return existingNotification;
    }

    const notification = new Notification(notificationData);
    await notification.save();

    console.log('✅ Created new notification:', {
      id: notification._id,
      type: notification.type,
      from: notification.fromUserId,
      to: notification.userId,
      message: notification.message
    });

    // Emit real-time notification via Socket.io
    const io = getIO();
    io.to(notificationData.userId).emit('notification', notification);

    return notification;
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
};
