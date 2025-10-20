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
    
    // Process uploaded files - works with both cloud storage and local storage
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
    
    // Get the public URL for media files (either cloud URLs or local paths)
    const resolvedPicturePath = (uploadedPicture && uploadedPicture.filename) || picturePath;
    const resolvedAudioPath = (uploadedAudio && uploadedAudio.filename) || audioPathFromBody;
    
    // Extract media paths from the file objects
    const mediaPaths = mediaList.map(m => m.filename);

    // Get location from request or use user's default location
    const postLocation = req.body.location || user.location;
    
    // Check if location coordinates are provided
    let locationData = {};
    if (req.body.locationCoords) {
      try {
        const coords = JSON.parse(req.body.locationCoords);
        if (coords && typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
          locationData = {
            latitude: coords.lat,
            longitude: coords.lng
          };
        }
      } catch (e) {
        console.error("Error parsing location coordinates:", e);
      }
    }
    
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: postLocation,
      locationData: Object.keys(locationData).length > 0 ? locationData : undefined,
      description,
      userPicturePath: user.picturePath,
      picturePath: resolvedPicturePath,
      audioPath: resolvedAudioPath,
      mediaPaths: mediaPaths,
      likes: {},
      comments: [],
    });
    
    await newPost.save();
    
    // Only return the newly created post
    const serializedNewPost = serializePost(newPost);
    
    // Broadcast only the single new post to avoid large payloads
    realtimeBus.emit('broadcast', { type: 'post:new', post: serializedNewPost });
    
    // Get the first page of posts with pagination for response
    const limit = 10;
    const posts = await Post.find().sort({ createdAt: -1 }).limit(limit);
    const total = await Post.countDocuments();
    
    return res.status(201).json({
      posts: posts.map(p => serializePost(p)),
      pagination: {
        total,
        page: 1,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: posts.length < total
      }
    });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ message: err.message || 'Failed to create post' });
  }
};