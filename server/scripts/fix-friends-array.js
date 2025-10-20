// Script to fix a user's friends array
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixUserFriends(userId) {
  try {
    console.log('Connecting to MongoDB...');
    
    // Try to connect using the URL from environment variables
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable not set');
    }
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check if the user ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`Invalid user ID format: ${userId}`);
      return;
    }
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`User with ID ${userId} not found in database`);
      return;
    }
    
    // Display user information
    console.log(`\nUser Information:`);
    console.log(`ID: ${user._id}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    
    // Initialize friends array if it doesn't exist
    if (!user.friends) {
      console.log('Creating empty friends array');
      user.friends = [];
      await user.save();
      console.log('Fixed: Created empty friends array');
      return;
    }
    
    const originalLength = user.friends.length;
    console.log(`\nFriends before cleanup: ${originalLength} entries`);
    
    // Filter out invalid friend IDs
    const validFriends = [];
    for (const friendId of user.friends) {
      // Check if it's a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(friendId)) {
        console.log(`Removing invalid ID format: ${friendId}`);
        continue;
      }
      
      // Check if friend exists in the database
      const friendExists = await User.findById(friendId);
      if (!friendExists) {
        console.log(`Removing non-existent friend ID: ${friendId}`);
        continue;
      }
      
      // Keep valid friend IDs
      validFriends.push(friendId);
    }
    
    // Update user's friends array
    user.friends = validFriends;
    await user.save();
    
    console.log(`\nFixed: Friends after cleanup: ${user.friends.length} entries`);
    console.log(`Removed ${originalLength - user.friends.length} invalid entries`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    try {
      await mongoose.connection.close();
      console.log('\nDisconnected from MongoDB');
    } catch (err) {
      // Ignore disconnect errors
    }
  }
}

// Check if user ID argument is provided
if (process.argv.length < 3) {
  console.log('Usage: node fix-friends-array.js <userId>');
  process.exit(1);
}

const userId = process.argv[2];
fixUserFriends(userId);