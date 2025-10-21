import Post from "../models/Post.js";
import User from "../models/User.js";

// Search both users and posts by keyword
export const search = async (req, res) => {
  try {
  const { query, from, to, mediaTypes } = req.query;
    
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

    // Build date range filter if provided
    let dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(to);
    }

    // Media type filtering
    let mediaTypeFilter = null;
    let selectedTypes = [];
    if (mediaTypes) {
      // Accept comma-separated string or array
      selectedTypes = Array.isArray(mediaTypes)
        ? mediaTypes
        : mediaTypes.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (selectedTypes.length > 0) {
        // Map media type to post fields
        const typeConditions = [];
        if (selectedTypes.includes('text')) {
          typeConditions.push({ mediaPaths: { $size: 0 } });
        }
        if (selectedTypes.includes('image')) {
          typeConditions.push({ mediaPaths: { $elemMatch: { $regex: /\.(jpg|jpeg|png|webp|bmp|svg)$/i } } });
        }
        if (selectedTypes.includes('video')) {
          typeConditions.push({ mediaPaths: { $elemMatch: { $regex: /\.(mp4|mov|avi|wmv|webm|mkv)$/i } } });
        }
        if (selectedTypes.includes('audio')) {
          typeConditions.push({ mediaPaths: { $elemMatch: { $regex: /\.(mp3|wav|ogg|aac|flac)$/i } } });
        }
        if (selectedTypes.includes('gif')) {
          typeConditions.push({ mediaPaths: { $elemMatch: { $regex: /\.gif$/i } } });
        }
        mediaTypeFilter = { $or: typeConditions };
      }
    }

    // Build final post query
    const postQuery = {
      $and: [
        { $or: [
          ...postSearchConditions,
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ["$firstName", " ", "$lastName"] },
                regex: fullNameRegex
              }
            }
          }
        ] },
        dateFilter,
        mediaTypeFilter
      ].filter(Boolean)
    };

    const posts = await Post.find(postQuery).select("_id userId firstName lastName description picturePath mediaPaths createdAt");

    // Format the posts to ensure proper serialization
    const formattedPosts = posts.map(p => {
      const obj = p.toObject();
      const mediaPaths = (obj.mediaPaths && obj.mediaPaths.length) 
        ? obj.mediaPaths 
        : (obj.picturePath ? [obj.picturePath] : []);
      return { ...obj, mediaPaths };
    });

    // Calculate counts per media type
    const typeCounts = {
      text: 0,
      image: 0,
      video: 0,
      audio: 0,
      gif: 0
    };
    for (const post of formattedPosts) {
      if (!post.mediaPaths || post.mediaPaths.length === 0) {
        typeCounts.text++;
      } else {
        for (const path of post.mediaPaths) {
          if (/\.gif$/i.test(path)) typeCounts.gif++;
          else if (/\.(jpg|jpeg|png|webp|bmp|svg)$/i.test(path)) typeCounts.image++;
          else if (/\.(mp4|mov|avi|wmv|webm|mkv)$/i.test(path)) typeCounts.video++;
          else if (/\.(mp3|wav|ogg|aac|flac)$/i.test(path)) typeCounts.audio++;
        }
      }
    }

    console.log(`Search results for query "${query}": ${users.length} users, ${formattedPosts.length} posts`);
    if (users.length === 0) {
      console.log("No users found. Search terms:", searchTerms);
      const sampleUsers = await User.find().limit(3).select("firstName lastName");
      console.log("Sample users in DB:", sampleUsers);
    }

    res.status(200).json({ 
      users, 
      posts: formattedPosts,
      counts: {
        users: users.length,
        posts: posts.length,
        total: users.length + posts.length,
        mediaTypes: typeCounts
      },
      query: {
        original: query,
        terms: searchTerms,
        mediaTypes: selectedTypes
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