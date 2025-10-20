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
    // Phase 1 Feature 26: simple (non-unique) impressions counter
    impressions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
