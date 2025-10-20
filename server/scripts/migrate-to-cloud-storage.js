import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Post from '../models/Post.js';
import User from '../models/User.js';

// CHOOSE ONE OF THESE CLOUD PROVIDERS AND UNCOMMENT THE RELEVANT SECTION:

// AMAZON S3
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { createReadStream } from 'fs';

// CLOUDINARY
// import { v2 as cloudinary } from 'cloudinary';

// AZURE BLOB STORAGE
// import { BlobServiceClient } from '@azure/storage-blob';

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

// Setup cloud provider
const setupCloudProvider = () => {
  // AMAZON S3
  /*
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return s3Client;
  */

  // CLOUDINARY
  /*
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
  */

  // AZURE BLOB STORAGE
  /*
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(
    process.env.AZURE_STORAGE_CONTAINER_NAME
  );
  return containerClient;
  */
  
  console.log('No cloud provider configured. Please uncomment one of the cloud provider sections.');
  process.exit(1);
};

// Upload file to cloud storage
const uploadToCloud = async (client, filePath, fileName) => {
  try {
    // AMAZON S3
    /*
    const fileStream = createReadStream(filePath);
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${fileName}`,
      Body: fileStream,
      ACL: 'public-read',
    };
    await client.send(new PutObjectCommand(uploadParams));
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${fileName}`;
    */

    // CLOUDINARY
    /*
    const result = await client.uploader.upload(filePath, {
      public_id: `mern-social/${fileName.split('.')[0]}`,
    });
    return result.secure_url;
    */

    // AZURE BLOB STORAGE
    /*
    const blockBlobClient = client.getBlockBlobClient(fileName);
    await blockBlobClient.uploadFile(filePath);
    return blockBlobClient.url;
    */
    
    return null;
  } catch (error) {
    console.error(`Failed to upload ${fileName}:`, error);
    return null;
  }
};

// Update database references
const updateDatabase = async (oldPath, newUrl, entityType) => {
  const fileName = path.basename(oldPath);
  
  try {
    if (entityType === 'post') {
      // Update posts with this file in picturePath
      await Post.updateMany(
        { picturePath: fileName },
        { $set: { picturePath: newUrl } }
      );
      
      // Update posts with this file in audioPath
      await Post.updateMany(
        { audioPath: fileName },
        { $set: { audioPath: newUrl } }
      );
      
      // Update posts with this file in mediaPaths array
      await Post.updateMany(
        { mediaPaths: fileName },
        { $pull: { mediaPaths: fileName } }
      );
      await Post.updateMany(
        { mediaPaths: { $ne: newUrl } },
        { $push: { mediaPaths: newUrl } }
      );
    } else if (entityType === 'user') {
      // Update users with this file in picturePath
      await User.updateMany(
        { picturePath: fileName },
        { $set: { picturePath: newUrl } }
      );
    }
    
    console.log(`Updated database references for ${fileName} to ${newUrl}`);
  } catch (error) {
    console.error(`Failed to update database for ${fileName}:`, error);
  }
};

// Main migration function
const migrateToCloud = async () => {
  try {
    await connectToDatabase();
    const cloudClient = setupCloudProvider();
    
    // Get all files in the assets directory
    const files = fs.readdirSync(assetsDir);
    console.log(`Found ${files.length} files to migrate`);
    
    // Process each file
    for (const file of files) {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        console.log(`Processing ${file}...`);
        
        // Upload to cloud storage
        const cloudUrl = await uploadToCloud(cloudClient, filePath, file);
        
        if (cloudUrl) {
          // Update database references
          await updateDatabase(filePath, cloudUrl, 'post');
          await updateDatabase(filePath, cloudUrl, 'user');
          
          console.log(`Migrated ${file} to cloud storage: ${cloudUrl}`);
        }
      }
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

migrateToCloud();