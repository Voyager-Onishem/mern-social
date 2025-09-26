import Post from "../models/Post.js";
import User from "../models/User.js";
import { realtimeBus } from '../index.js';

// Helper to normalize a Post document/plain object for JSON responses
function serializePost(p) {
  if (!p) return null;
  const obj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
  const mediaPaths = (obj.mediaPaths && obj.mediaPaths.length) ? obj.mediaPaths : (obj.picturePath ? [obj.picturePath] : []);
  const likes = obj.likes instanceof Map ? Object.fromEntries(obj.likes) : (obj.likes || {});
  return { ...obj, mediaPaths, likes };
}

// GET SINGLE POST
export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(serializePost(post));
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
    res.status(200).json(serializePost(updatedPost));
    realtimeBus.emit('broadcast', { type: 'comment:add', postId: id, post: serializePost(updatedPost) });
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
    return res.status(200).json(serializePost(post));
    realtimeBus.emit('broadcast', { type: 'comment:edit', postId: id, post: serializePost(post) });
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
    return res.status(200).json(serializePost(post));
    realtimeBus.emit('broadcast', { type: 'comment:delete', postId: id, post: serializePost(post) });
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
    const MAX_MEDIA_FILES = parseInt(process.env.MAX_MEDIA_FILES || '5', 10);
    if (Array.isArray(req.files)) {
      for (const f of req.files) {
        const mime = f.mimetype || '';
        if (mime.startsWith('audio/') && !uploadedAudio) {
          uploadedAudio = f;
        } else if ((mime.startsWith('image/') || /^video\/(mp4|webm|ogg)$/i.test(mime))) {
          if (mediaList.length < MAX_MEDIA_FILES) {
            mediaList.push(f);
          }
          if (!uploadedPicture) uploadedPicture = f;
        }
      }
    } else if (req.files) {
      const picArr = req.files.picture || req.files.media || [];
      const audioArr = req.files.audio || [];
      if (Array.isArray(picArr)) {
        mediaList = picArr.slice(0, MAX_MEDIA_FILES);
        uploadedPicture = picArr[0];
      }
      if (Array.isArray(audioArr)) uploadedAudio = audioArr[0];
    }
    if (mediaList.length > MAX_MEDIA_FILES) mediaList = mediaList.slice(0, MAX_MEDIA_FILES);
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
    const serialized = posts.map(p => serializePost(p));
    // Broadcast only the single new post to avoid large payloads
    realtimeBus.emit('broadcast', { type: 'post:new', post: serializePost(newPost) });
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
    res.status(200).json(post.map(p => serializePost(p)));
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId });
    // Reuse serializePost to ensure likes Map converted & mediaPaths normalized
    res.status(200).json(posts.map(p => serializePost(p)));
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    // Support both body userId and token-based id (body takes precedence)
    let { userId } = req.body || {};
    if (!userId && req.user && req.user.id) userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required to like/unlike a post' });
    }
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Normalize likes to plain object for toggle logic
    const likesObj = post.likes instanceof Map ? Object.fromEntries(post.likes) : (post.likes || {});
    const alreadyLiked = !!likesObj[userId];
    if (alreadyLiked) delete likesObj[userId]; else likesObj[userId] = true;

    // Persist back (Mongoose will coerce plain object into Map)
    post.likes = likesObj;
    await post.save();
    const fresh = await Post.findById(id);
    const serialized = serializePost(fresh);
    res.status(200).json(serialized);
    realtimeBus.emit('broadcast', { type: 'post:like', postId: id, post: serialized });
  } catch (err) {
    console.error('likePost error:', err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Failed to like post' });
  }
};

// DANGEROUS: Delete all posts that contain an audioPath field. Intended one-off maintenance endpoint.
// In production this should be protected (e.g., admin role). For now it is token-protected only.
export const purgeAudioPosts = async (req, res) => {
  try {
    const result = await Post.deleteMany({ audioPath: { $exists: true, $ne: null, $ne: '' } });
    return res.status(200).json({ deletedCount: result.deletedCount });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to purge audio posts' });
  }
};
