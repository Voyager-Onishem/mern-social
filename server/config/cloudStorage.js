// Cloud storage configuration for Cloudinary
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const cloudStorageConfig = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mern-social',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'ogg', 'mp3', 'wav'],
    resource_type: 'auto', // Let Cloudinary detect the resource type (image/video/raw)
    transformation: [
      { quality: 'auto' }, // Automatic quality optimization
      { fetch_format: 'auto' } // Automatic format selection based on browser
    ]
  }
});

// Helper function to extract public URL from storage response
export const getPublicUrl = (file) => {
  // For Cloudinary - the main provider we're using
  if (file.path) return file.path;
  
  // Fallback for local storage (development)
  if (file.filename) return `/assets/${file.filename}`;
  
  return null;
};

// Export the cloudinary instance for direct operations (e.g., in migration script)
export const cloudinaryInstance = cloudinary;