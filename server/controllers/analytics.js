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
    // Phase 1: naive increment for each provided post ID.
    // Defensive: filter out clearly invalid ObjectIds (previously could trigger CastError despite comment to "ignore").
    const validIds = postIds.filter(id => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) {
      return res.status(200).json({ impressions: [] }); // nothing valid; treat as no-op
    }
    const ops = validIds.map(id => ({
      updateOne: {
        filter: { _id: id },
        update: { $inc: { impressions: 1 } }
      }
    }));
    if (ops.length) {
      await Post.bulkWrite(ops, { ordered: false });
    }

    // Fetch current counts for the requested posts (only those that exist)
    const posts = await Post.find({ _id: { $in: validIds } }).select('_id impressions');
    return res.status(200).json({ impressions: posts.map(p => ({ postId: p._id, impressions: p.impressions })) });
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
