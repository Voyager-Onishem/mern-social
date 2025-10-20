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
    console.log(`Getting friends for user ${id}`);
    
    // Check if the ID is valid
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    const user = await User.findById(id);
    
    // Check if user exists
    if (!user) {
      console.log(`User ${id} not found`);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log(`Found user ${user.firstName} ${user.lastName}, friends count: ${user.friends?.length || 0}`);
    
    // Check if friends array exists
    if (!user.friends || !Array.isArray(user.friends)) {
      console.log(`User ${id} has no friends array`);
      return res.status(200).json([]);
    }
    
    // Filter out any invalid IDs to prevent errors
    const validFriendIds = user.friends.filter(friendId => 
      friendId && typeof friendId === 'string' && friendId.match(/^[0-9a-fA-F]{24}$/));
    
    console.log(`Valid friend IDs: ${validFriendIds.length}`);
    
    // If no valid friend IDs, return empty array
    if (validFriendIds.length === 0) {
      return res.status(200).json([]);
    }
    
    const friends = await Promise.all(
      validFriendIds.map(async (friendId) => {
        try {
          return await User.findById(friendId);
        } catch (err) {
          console.error(`Error finding friend with ID ${friendId}:`, err.message);
          return null;
        }
      })
    );
    
    // Filter out any nulls from failed lookups
    const validFriends = friends.filter(friend => friend !== null);
    console.log(`Found ${validFriends.length} valid friends out of ${validFriendIds.length} IDs`);
    
    const formattedFriends = validFriends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    console.error(`Error in getUserFriends:`, err);
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    console.log(`Add/remove friend operation: user ${id}, friend ${friendId}`);
    
    // Validate IDs
    if (!id.match(/^[0-9a-fA-F]{24}$/) || !friendId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // Prevent adding yourself as friend
    if (id === friendId) {
      return res.status(400).json({ message: "Cannot add yourself as friend" });
    }

    const user = await User.findById(id);
    const friend = await User.findById(friendId);
    
    // Check if both users exist
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }
    
    // Ensure friends arrays exist
    if (!user.friends) user.friends = [];
    if (!friend.friends) friend.friends = [];
    
    // Convert all IDs to strings for consistent comparison
    const userFriends = user.friends.map(fid => fid.toString());
    
    // Check if already friends
    if (userFriends.includes(friendId)) {
      console.log(`Removing friend ${friendId} from user ${id}`);
      // Remove friend
      user.friends = user.friends.filter(fid => fid.toString() !== friendId);
      friend.friends = friend.friends.filter(fid => fid.toString() !== id);
    } else {
      console.log(`Adding friend ${friendId} to user ${id}`);
      // Add friend
      user.friends.push(friendId);
      friend.friends.push(id);
    }
    
    await user.save();
    await friend.save();
    
    // Get updated friends list
    const friendIds = user.friends.filter(fid => 
      fid && typeof fid === 'string' && fid.match(/^[0-9a-fA-F]{24}$/));
    
    const friends = await Promise.all(
      friendIds.map(async (friendId) => {
        try {
          return await User.findById(friendId);
        } catch (err) {
          console.error(`Error finding friend with ID ${friendId}:`, err.message);
          return null;
        }
      })
    );
    
    // Filter out nulls and format
    const validFriends = friends.filter(f => f !== null);
    const formattedFriends = validFriends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );

    console.log(`Returning ${formattedFriends.length} friends after add/remove operation`);
    res.status(200).json(formattedFriends);
  } catch (err) {
    console.error(`Error in addRemoveFriend:`, err);
    res.status(500).json({ message: err.message });
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
    const allowed = ['location', 'occupation', 'role', 'twitterUrl', 'linkedinUrl', 'firstName', 'lastName'];
    const updates = {};
    allowed.forEach((f) => {
      if (typeof req.body[f] === 'string') {
        updates[f] = req.body[f].trim();
      }
    });
    // If multer added a file for picture (e.g., picture), accept it
    if (req.file && req.file.filename) {
      updates.picturePath = req.file.filename;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }
    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Return a trimmed user object (avoid password hash exposure)
    const { _id, firstName, lastName, location, occupation, role, twitterUrl, linkedinUrl, picturePath, friends, viewedProfile, impressions } = user;
    return res.status(200).json({ _id, firstName, lastName, location, occupation, role, twitterUrl, linkedinUrl, picturePath, friends, viewedProfile, impressions });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
};
