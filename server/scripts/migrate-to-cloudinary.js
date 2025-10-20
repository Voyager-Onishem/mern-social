import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// Setup environment variables
dotenv.config();

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.join(__dirname, '../public/assets');

// Setup MongoDB connection
const connectToDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Setup Cloudinary
const setupCloudinary = () => {
  // Verify required environment variables
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Missing required Cloudinary environment variables. Please check your .env file.');
    process.exit(1);
  }
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  
  return cloudinary;
};

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, fileName) => {
  try {
    console.log(`Uploading ${fileName} to Cloudinary...`);
    
    // The 'resource_type' parameter is important for proper handling of different file types
    let resourceType = 'auto';
    
    // Determine if we need to force a specific resource type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    if (['.mp3', '.ogg', '.wav', '.m4a'].includes(ext)) {
      resourceType = 'video'; // Cloudinary uses 'video' resource type for audio files too
    }
    
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: `mern-social/${path.basename(fileName, ext)}`,
      folder: 'mern-social',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true
    });
    
    console.log(`Upload successful. URL: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${fileName}:`, error);
    return null;
  }
};

// Update database references
const updateDatabase = async (oldFileName, newUrl) => {
  try {
    // Update user profile pictures
    const usersUpdated = await User.updateMany(
      { picturePath: oldFileName },
      { $set: { picturePath: newUrl } }
    );
    
    // Update post picture paths
    const postsUpdated = await Post.updateMany(
      { picturePath: oldFileName },
      { $set: { picturePath: newUrl } }
    );
    
    // Update post audio paths
    const audioUpdated = await Post.updateMany(
      { audioPath: oldFileName },
      { $set: { audioPath: newUrl } }
    );
    
    // Update posts with this file in mediaPaths array
    const mediaPathsUpdated = await Post.updateMany(
      { mediaPaths: oldFileName },
      { $pull: { mediaPaths: oldFileName } }
    );
    
    if (mediaPathsUpdated.modifiedCount > 0) {
      await Post.updateMany(
        { "mediaPaths": { $ne: newUrl } },
        { $push: { mediaPaths: newUrl } }
      );
    }
    
    // Update user pictures in comments
    const commentsUpdated = await Post.updateMany(
      { "comments.userPicturePath": oldFileName },
      { $set: { "comments.$[elem].userPicturePath": newUrl } },
      { arrayFilters: [{ "elem.userPicturePath": oldFileName }] }
    );
    
    console.log(`Database updates for ${oldFileName} -> ${newUrl}:`);
    console.log(`- Users updated: ${usersUpdated.modifiedCount}`);
    console.log(`- Posts updated (picturePath): ${postsUpdated.modifiedCount}`);
    console.log(`- Posts updated (audioPath): ${audioUpdated.modifiedCount}`);
    console.log(`- Posts updated (mediaPaths): ${mediaPathsUpdated.modifiedCount}`);
    console.log(`- Comments updated: ${commentsUpdated.modifiedCount}`);
    
    return usersUpdated.modifiedCount + postsUpdated.modifiedCount + 
           audioUpdated.modifiedCount + mediaPathsUpdated.modifiedCount +
           commentsUpdated.modifiedCount;
  } catch (error) {
    console.error(`Failed to update database for ${oldFileName}:`, error);
    return 0;
  }
};

// Main migration function
const migrateToCloudinary = async () => {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Setup Cloudinary
    setupCloudinary();
    
    // Verify the assets directory exists
    if (!fs.existsSync(assetsDir)) {
      console.error(`Assets directory not found: ${assetsDir}`);
      process.exit(1);
    }
    
    // Get all files in the assets directory
    const files = fs.readdirSync(assetsDir);
    console.log(`Found ${files.length} files to migrate`);
    
    // Track statistics
    let totalFiles = files.length;
    let successfulUploads = 0;
    let failedUploads = 0;
    let databaseUpdates = 0;
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      
      // Skip directories
      if (!stats.isFile()) {
        console.log(`Skipping directory: ${file}`);
        totalFiles--;
        continue;
      }
      
      console.log(`[${i+1}/${files.length}] Processing ${file}...`);
      
      // Upload to Cloudinary
      const cloudUrl = await uploadToCloudinary(filePath, file);
      
      if (cloudUrl) {
        // Update database references
        const updates = await updateDatabase(file, cloudUrl);
        databaseUpdates += updates;
        successfulUploads++;
      } else {
        failedUploads++;
        console.error(`Failed to upload ${file} to Cloudinary`);
      }
    }
    
    // Print summary
    console.log('\n=== Migration Summary ===');
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`Successful uploads: ${successfulUploads}`);
    console.log(`Failed uploads: ${failedUploads}`);
    console.log(`Database references updated: ${databaseUpdates}`);
    
    if (successfulUploads === totalFiles) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️ Migration completed with some issues.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
  }
};

// Run the migration
migrateToCloudinary();