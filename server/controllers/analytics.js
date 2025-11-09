import User from '../models/User.js';
import Post from '../models/Post.js';
import mongoose from 'mongoose';

// Phase 1 (Feature 26): minimal analytics endpoints.
// Non-unique counters only. Lightweight and idempotent-ish with basic guardrails.
// Future phases will introduce event collections & uniqueness logic.

export const recordProfileView = async (req, res) => {
  try {
    const { profileUserId } = req.body || {};
    if (!profileUserId) return res.status(400).json({ message: 'profileUserId required' });
    const viewerId = req.user?.id;
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });
    if (viewerId === profileUserId) return res.status(200).json({ skipped: true, reason: 'self-view' });

    const result = await User.findByIdAndUpdate(
      profileUserId,
      { $inc: { profileViewsTotal: 1 } },
      { new: true }
    ).select('_id profileViewsTotal');
    if (!result) return res.status(404).json({ message: 'Profile user not found' });
    return res.status(200).json({ profileUserId, profileViewsTotal: result.profileViewsTotal });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to record profile view' });
  }
};

export const recordPostImpressions = async (req, res) => {
  try {
    const { postIds } = req.body || {};
    if (!Array.isArray(postIds) || !postIds.length) {
      return res.status(400).json({ message: 'postIds array required' });
    }
    const viewerId = req.user?.id;
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });
    
    // Filter out invalid ObjectIds
    const validIds = postIds.filter(id => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) {
      return res.status(200).json({ impressions: [] });
    }

    // Process each post to track unique impressions
    const results = [];
    const now = new Date();
    
    for (const postId of validIds) {
      try {
        const post = await Post.findById(postId);
        if (!post) continue; // Skip non-existent posts
        
        // Check if this user has already viewed this post
        const userImpressionData = post.impressionsByUser?.get(viewerId);
        
        if (!userImpressionData) {
          // First time this user is viewing this post - count as new impression
          const viewData = {
            count: 1,
            firstViewedAt: now,
            lastViewedAt: now
          };
          
          post.impressionsByUser.set(viewerId, viewData);
          post.impressions = (post.impressions || 0) + 1; // Increment unique impression count
          await post.save();
          
          results.push({ postId: post._id, impressions: post.impressions, isNew: true });
        } else {
          // User has viewed before - update view metadata but don't increment impression count
          userImpressionData.count += 1;
          userImpressionData.lastViewedAt = now;
          post.impressionsByUser.set(viewerId, userImpressionData);
          await post.save();
          
          results.push({ postId: post._id, impressions: post.impressions, isNew: false });
        }
      } catch (err) {
        console.error(`Error recording impression for post ${postId}:`, err);
        // Continue processing other posts
      }
    }

    return res.status(200).json({ impressions: results });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to record impressions' });
  }
};

export const getPostImpressionSummary = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const post = await Post.findById(id).select('_id impressions');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    return res.status(200).json({ postId: post._id, impressions: post.impressions });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch post summary' });
  }
};

export const getProfileViewSummary = async (req, res) => {
  try {
    const { id } = req.params; // profile user id
    const user = await User.findById(id).select('_id profileViewsTotal');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ profileUserId: user._id, profileViewsTotal: user.profileViewsTotal });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch profile view summary' });
  }
};

// Check which posts the current user has already viewed
export const checkUserPostViews = async (req, res) => {
  try {
    const { postIds } = req.body || {};
    if (!Array.isArray(postIds) || !postIds.length) {
      return res.status(400).json({ message: 'postIds array required' });
    }
    const viewerId = req.user?.id;
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized' });
    
    const validIds = postIds.filter(id => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) {
      return res.status(200).json({ viewedPosts: {} });
    }

    const posts = await Post.find({ _id: { $in: validIds } }).select('_id impressionsByUser');
    const viewedPosts = {};
    
    posts.forEach(post => {
      const userView = post.impressionsByUser?.get(viewerId);
      if (userView) {
        viewedPosts[post._id.toString()] = {
          count: userView.count,
          firstViewedAt: userView.firstViewedAt,
          lastViewedAt: userView.lastViewedAt
        };
      }
    });

    return res.status(200).json({ viewedPosts });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to check post views' });
  }
};

// Aggregate total post impressions for a given user (sum of all their post.impressions)
export const getUserImpressionsSummary = async (req, res) => {
  try {
    const { id } = req.params; // user id
    const result = await Post.aggregate([
      { $match: { userId: id } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$impressions", 0] } } } }
    ]);
    const total = result.length ? result[0].total : 0;
    return res.status(200).json({ userId: id, impressionsTotal: total });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to aggregate impressions' });
  }
};

// Development / maintenance endpoint: reset all counters (profile views & impressions)
// WARNING: Not protected by role; only use in trusted environments.
export const resetAllEngagementCounters = async (_req, res) => {
  try {
    await Promise.all([
      User.updateMany({}, { $set: { profileViewsTotal: 0, viewedProfile: 0, impressions: 0 } }),
      Post.updateMany({}, { $set: { impressions: 0 } })
    ]);
    return res.status(200).json({ status: 'ok', reset: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to reset counters' });
  }
};
