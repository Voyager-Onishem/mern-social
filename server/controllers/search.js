import Post from "../models/Post.js";
import User from "../models/User.js";

// Search both users and posts by keyword
export const search = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    // Enhanced search logic to handle multiple words and partial matches
    const searchTerms = query.trim().split(/\s+/);
    
    // Create a search condition for each term
    const searchConditions = [];
    
    // For each search term, create a regex search condition
    for (const term of searchTerms) {
      const termRegex = new RegExp(term, "i");
      searchConditions.push({
        $or: [
          { firstName: { $regex: termRegex } },
          { lastName: { $regex: termRegex } },
          { location: { $regex: termRegex } },
          { occupation: { $regex: termRegex } }
        ]
      });
    }
    
    // Create a single combined full name field for exact matching
    const fullNameRegex = new RegExp(query, "i");
    
    // Search for users with enhanced logic
    const users = await User.find({
      $or: [
        // Match any individual term
        ...searchConditions,
        // Match full name as a combined field
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: fullNameRegex
            }
          }
        }
      ]
    }).select("_id firstName lastName picturePath occupation location");
    
    // Search for posts with enhanced logic
    const postSearchConditions = [];
    
    // For each search term, create a regex search condition
    for (const term of searchTerms) {
      const termRegex = new RegExp(term, "i");
      postSearchConditions.push({
        $or: [
          { description: { $regex: termRegex } },
          { firstName: { $regex: termRegex } },
          { lastName: { $regex: termRegex } },
          { location: { $regex: termRegex } }
        ]
      });
    }
    
    const posts = await Post.find({
      $or: [
        // Match any individual term
        ...postSearchConditions,
        // Match full name as a combined field
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: fullNameRegex
            }
          }
        }
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

    console.log(`Search results for query "${query}": ${users.length} users, ${formattedPosts.length} posts`);
    
    if (users.length === 0) {
      console.log("No users found. Search terms:", searchTerms);
      // Log some sample users from the DB to verify data
      const sampleUsers = await User.find().limit(3).select("firstName lastName");
      console.log("Sample users in DB:", sampleUsers);
    }
    
    res.status(200).json({ 
      users, 
      posts: formattedPosts,
      counts: {
        users: users.length,
        posts: posts.length,
        total: users.length + posts.length
      },
      query: {
        original: query,
        terms: searchTerms
      }
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ 
      message: err.message,
      error: {
        name: err.name,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
      }
    });
  }
};