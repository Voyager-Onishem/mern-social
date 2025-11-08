import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true, // For fast queries by user
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'friend_request', 'friend_accept'],
      required: true,
    },
    fromUserId: {
      type: String,
      required: true,
    },
    fromUserName: {
      type: String,
      required: true,
    },
    fromUserPicture: {
      type: String,
    },
    postId: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true, // For fast queries of unread notifications
    },
  },
  { timestamps: true }
);

// Compound index for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
