// Script to check if a user exists and has valid friends
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkUser(userId) {
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
    console.log(`Email: ${user.email}`);
    console.log(`Location: ${user.location || 'Not set'}`);
    console.log(`Occupation: ${user.occupation || 'Not set'}`);
    
    // Check if friends array exists
    if (!user.friends) {
      console.log(`User has no friends array`);
      return;
    }
    
    console.log(`\nFriends Array (${user.friends.length} entries):`);
    
    // Display all friend IDs
    if (user.friends.length === 0) {
      console.log('User has no friends (empty array)');
    } else {
      // Check each friend ID
      for (let i = 0; i < user.friends.length; i++) {
        const friendId = user.friends[i];
        console.log(`[${i}] Friend ID: ${friendId}`);
        
        // Check if friend ID is valid
        if (!mongoose.Types.ObjectId.isValid(friendId)) {
          console.log(`  - INVALID ID FORMAT`);
          continue;
        }
        
        // Check if friend exists
        const friend = await User.findById(friendId);
        if (!friend) {
          console.log(`  - FRIEND NOT FOUND IN DATABASE`);
        } else {
          console.log(`  - ${friend.firstName} ${friend.lastName} (${friend.email})`);
          
          // Check if the friendship is mutual
          const isMutual = friend.friends?.includes(userId);
          console.log(`  - Mutual friendship: ${isMutual ? 'YES' : 'NO'}`);
        }
      }
    }
    
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
  console.log('Usage: node check-user-friends.js <userId>');
  process.exit(1);
}

const userId = process.argv[2];
checkUser(userId);