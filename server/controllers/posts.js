// GET SINGLE POST
export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
// ADD COMMENT
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const commentObj = {
      userId,
      username: `${user.firstName} ${user.lastName}`,
      userPicturePath: user.picturePath,
      text,
      createdAt: new Date(),
    };

    // Use $push to append without re-writing the whole comments array
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $push: { comments: commentObj } },
      { new: true }
    );
    if (!updatedPost) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
import Post from "../models/Post.js";
import User from "../models/User.js";

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description, picturePath, audioPath: audioPathFromBody } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Support both upload.fields and upload.any()
    let uploadedPicture = null;
    let uploadedAudio = null;
    if (Array.isArray(req.files)) {
      // Using upload.any(): find first file by mime type
      for (const f of req.files) {
        if (!uploadedPicture && f.mimetype && (f.mimetype.startsWith('image/') || /^video\/(mp4|webm|ogg)$/i.test(f.mimetype))) {
          uploadedPicture = f;
        }
        if (!uploadedAudio && f.mimetype && f.mimetype.startsWith('audio/')) {
          uploadedAudio = f;
        }
      }
    } else if (req.files) {
      // Using upload.fields: objects with arrays
      uploadedPicture = req.files.picture && req.files.picture[0];
      uploadedAudio = req.files.audio && req.files.audio[0];
    }
    const resolvedPicturePath = (uploadedPicture && uploadedPicture.filename) || picturePath;
    const resolvedAudioPath = (uploadedAudio && uploadedAudio.filename) || audioPathFromBody;

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath: resolvedPicturePath,
      audioPath: resolvedAudioPath,
      likes: {},
      comments: [],
    });
  await newPost.save();
  const post = await Post.find();
  return res.status(201).json(post);
  } catch (err) {
  console.error('createPost error:', err);
  res.status(500).json({ message: err.message || 'Failed to create post' });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const post = await Post.find();
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const post = await Post.find({ userId });
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
