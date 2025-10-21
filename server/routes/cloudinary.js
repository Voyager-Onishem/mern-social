import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Test Cloudinary configuration and connectivity
router.get('/test-cloudinary', async (req, res) => {
  try {
    // Verify that required environment variables are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Missing Cloudinary configuration in environment variables',
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
          api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
          api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
        }
      });
    }

    // Configure cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Test the connection
    const result = await cloudinary.api.ping();

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Cloudinary connection successful',
      result,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
});

export default router;