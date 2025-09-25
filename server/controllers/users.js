import User from "../models/User.js";

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (user.friends.includes(friendId)) {
      user.friends = user.friends.filter((id) => id !== friendId);
      friend.friends = friend.friends.filter((id) => id !== id);
    } else {
      user.friends.push(friendId);
      friend.friends.push(id);
    }
    await user.save();
    await friend.save();

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* PARTIAL UPDATE: profile fields (location, occupation) */
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    // Only allow self-update (or future admin check)
    if (!req.user || req.user.id !== id) {
      return res.status(403).json({ error: 'Forbidden: cannot edit another user profile' });
    }
    const allowed = ['location', 'occupation'];
    const updates = {};
    allowed.forEach((f) => {
      if (typeof req.body[f] === 'string') {
        updates[f] = req.body[f].trim();
      }
    });
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }
    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Return a trimmed user object (avoid password hash exposure)
    const { _id, firstName, lastName, location, occupation, picturePath, friends, viewedProfile, impressions } = user;
    return res.status(200).json({ _id, firstName, lastName, location, occupation, picturePath, friends, viewedProfile, impressions });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
};
