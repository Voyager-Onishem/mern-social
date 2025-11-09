import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    location: String,
    locationData: {
      latitude: Number,
      longitude: Number
    },
    description: String,
    picturePath: String,
    userPicturePath: String,
    audioPath: String,
    mediaPaths: [String],
    likes: {
      type: Map,
      of: Boolean,
    },
    comments: [
      {
        userId: String,
        username: String,
        userPicturePath: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
        editedAt: { type: Date },
      },
    ],
    // Impression tracking (unique per user)
    impressions: { type: Number, default: 0 }, // Total unique impression count
    impressionsByUser: {
      type: Map,
      of: {
        count: { type: Number, default: 1 }, // How many times this user viewed it
        firstViewedAt: { type: Date, default: Date.now }, // When first viewed
        lastViewedAt: { type: Date, default: Date.now }, // Most recent view
      },
      default: new Map()
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
