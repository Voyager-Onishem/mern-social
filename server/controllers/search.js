import Post from "../models/Post.js";
import User from "../models/User.js";

// Search both users and posts by keyword
export const search = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    // Case-insensitive search with RegExp
    const searchRegex = new RegExp(query, "i");
    
    // Search for users
    const users = await User.find({
      $or: [
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
        { location: { $regex: searchRegex } },
        { occupation: { $regex: searchRegex } }
      ]
    }).select("_id firstName lastName picturePath occupation location");
    
    // Search for posts
    const posts = await Post.find({
      $or: [
        { description: { $regex: searchRegex } },
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
        { location: { $regex: searchRegex } }
      ]
    }).select("_id userId firstName lastName description picturePath mediaPaths createdAt");

    // Format the posts to ensure proper serialization
    const formattedPosts = posts.map(p => {
      const obj = p.toObject();
      const mediaPaths = (obj.mediaPaths && obj.mediaPaths.length) 
        ? obj.mediaPaths 
        : (obj.picturePath ? [obj.picturePath] : []);
      return { ...obj, mediaPaths };
    });

    res.status(200).json({ 
      users, 
      posts: formattedPosts,
      counts: {
        users: users.length,
        posts: posts.length,
        total: users.length + posts.length
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};