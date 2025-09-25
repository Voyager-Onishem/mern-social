import Post from "../models/Post.js";
import User from "../models/User.js";

// GET SINGLE POST
export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const serialized = {
      ...post.toObject(),
      mediaPaths: (post.mediaPaths && post.mediaPaths.length) ? post.mediaPaths : (post.picturePath ? [post.picturePath] : []),
    };
    res.status(200).json(serialized);
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
// EDIT COMMENT
export const editComment = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const { commentId, userId, text } = req.body;
  if (!commentId || !userId || !text) return res.status(400).json({ code: 'invalid_request', message: 'commentId, userId and text are required' });
    const post = await Post.findById(id);
  if (!post) return res.status(404).json({ code: 'post_not_found', message: 'Post not found' });
    const comment = post.comments.id(commentId) || post.comments.find(c => String(c._id) === String(commentId));
  if (!comment) return res.status(404).json({ code: 'comment_not_found', message: 'Comment not found' });
  if (String(comment.userId) !== String(userId)) return res.status(403).json({ code: 'forbidden', message: 'Cannot edit another user\'s comment' });
    comment.text = text;
    comment.editedAt = new Date();
    await post.save();
    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
// DELETE COMMENT
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const { commentId, userId } = req.body;
  if (!commentId || !userId) return res.status(400).json({ code: 'invalid_request', message: 'commentId and userId are required' });
    const post = await Post.findById(id);
  if (!post) return res.status(404).json({ code: 'post_not_found', message: 'Post not found' });
    const commentIndex = post.comments.findIndex(c => String(c._id) === String(commentId));
  if (commentIndex === -1) return res.status(404).json({ code: 'comment_not_found', message: 'Comment not found' });
  if (String(post.comments[commentIndex].userId) !== String(userId)) return res.status(403).json({ code: 'forbidden', message: 'Cannot delete another user\'s comment' });
    post.comments.splice(commentIndex, 1);
    await post.save();
    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

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
    // Gather media files (images/videos) - keep first for backward compatibility
    let uploadedPicture = null; // first image/video
    let uploadedAudio = null;
    let mediaList = [];
    if (Array.isArray(req.files)) {
      for (const f of req.files) {
        const mime = f.mimetype || '';
        if (mime.startsWith('audio/') && !uploadedAudio) {
          uploadedAudio = f;
        } else if ((mime.startsWith('image/') || /^video\/(mp4|webm|ogg)$/i.test(mime))) {
          mediaList.push(f);
          if (!uploadedPicture) uploadedPicture = f;
        }
      }
    } else if (req.files) {
      const picArr = req.files.picture || req.files.media || [];
      const audioArr = req.files.audio || [];
      if (Array.isArray(picArr)) {
        mediaList = picArr;
        uploadedPicture = picArr[0];
      }
      if (Array.isArray(audioArr)) uploadedAudio = audioArr[0];
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
      mediaPaths: mediaList.map(m => m.filename),
      likes: {},
      comments: [],
    });
    await newPost.save();
    const posts = await Post.find();
    const serialized = posts.map(p => ({
      ...p.toObject(),
      mediaPaths: (p.mediaPaths && p.mediaPaths.length) ? p.mediaPaths : (p.picturePath ? [p.picturePath] : []),
    }));
    return res.status(201).json(serialized);
  } catch (err) {
  console.error('createPost error:', err);
  res.status(500).json({ message: err.message || 'Failed to create post' });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const post = await Post.find();
    res.status(200).json(post.map(p => ({
      ...p.toObject(),
      mediaPaths: (p.mediaPaths && p.mediaPaths.length) ? p.mediaPaths : (p.picturePath ? [p.picturePath] : []),
    })));
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const post = await Post.find({ userId });
    res.status(200).json(post.map(p => ({
      ...p.toObject(),
      mediaPaths: (p.mediaPaths && p.mediaPaths.length) ? p.mediaPaths : (p.picturePath ? [p.picturePath] : []),
    })));
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

    res.status(200).json({
      ...updatedPost.toObject(),
      mediaPaths: (updatedPost.mediaPaths && updatedPost.mediaPaths.length) ? updatedPost.mediaPaths : (updatedPost.picturePath ? [updatedPost.picturePath] : []),
    });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
