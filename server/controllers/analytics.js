import User from '../models/User.js';
import Post from '../models/Post.js';

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
    // We ignore invalid IDs silently to keep the endpoint resilient.
    const ops = postIds.map(id => ({
      updateOne: {
        filter: { _id: id },
        update: { $inc: { impressions: 1 } }
      }
    }));
    await Post.bulkWrite(ops, { ordered: false });

    // Fetch current counts for the requested posts (only those that exist)
    const posts = await Post.find({ _id: { $in: postIds } }).select('_id impressions');
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
