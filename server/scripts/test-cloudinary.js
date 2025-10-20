import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Setup environment variables
dotenv.config();

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testImagePath = path.join(__dirname, 'test-image.jpg');

// Function to create a simple test image if one doesn't exist
const createTestImage = () => {
  if (fs.existsSync(testImagePath)) {
    console.log('Using existing test image');
    return;
  }
  
  console.log('Creating test image...');
  
  // Create a simple 100x100 black image
  const size = 100;
  const data = Buffer.alloc(size * size * 3);
  
  // Fill with black pixels
  for (let i = 0; i < size * size * 3; i++) {
    data[i] = 0;
  }
  
  // Write a simple BMP file
  const header = Buffer.alloc(54);
  header.write('BM', 0);
  header.writeUInt32LE(54 + size * size * 3, 2); // File size
  header.writeUInt32LE(0, 6); // Reserved
  header.writeUInt32LE(54, 10); // Offset to pixel data
  header.writeUInt32LE(40, 14); // DIB header size
  header.writeUInt32LE(size, 18); // Width
  header.writeUInt32LE(size, 22); // Height
  header.writeUInt16LE(1, 26); // Planes
  header.writeUInt16LE(24, 28); // Bits per pixel
  header.writeUInt32LE(0, 30); // Compression
  header.writeUInt32LE(size * size * 3, 34); // Image size
  header.writeUInt32LE(2835, 38); // X pixels per meter
  header.writeUInt32LE(2835, 42); // Y pixels per meter
  header.writeUInt32LE(0, 46); // Total colors
  header.writeUInt32LE(0, 50); // Important colors
  
  // Write the file
  const fd = fs.openSync(testImagePath, 'w');
  fs.writeSync(fd, header);
  fs.writeSync(fd, data);
  fs.closeSync(fd);
  
  console.log('Test image created');
};

// Main function to test Cloudinary configuration
const testCloudinaryConfig = async () => {
  console.log('Testing Cloudinary configuration...');
  
  // Check for environment variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('❌ Missing Cloudinary environment variables.');
    console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
    process.exit(1);
  }
  
  console.log('✅ Cloudinary environment variables found.');
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
  
  // Test account access
  try {
    console.log('Checking account access...');
    const accountResult = await cloudinary.api.ping();
    console.log('✅ Account access verified: ', accountResult.status);
  } catch (error) {
    console.error('❌ Account access failed:', error.message);
    process.exit(1);
  }
  
  // Create test image
  createTestImage();
  
  // Test upload
  try {
    console.log('Testing upload functionality...');
    const uploadResult = await cloudinary.uploader.upload(testImagePath, {
      folder: 'mern-social-test',
      resource_type: 'auto'
    });
    console.log('✅ Upload successful!');
    console.log('Image URL:', uploadResult.secure_url);
    
    // Test deletion
    console.log('Testing deletion functionality...');
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('✅ Deletion successful!');
  } catch (error) {
    console.error('❌ Upload/deletion test failed:', error.message);
    process.exit(1);
  }
  
  console.log('\n✅ All Cloudinary tests passed! Your configuration is working correctly.');
  console.log('You can now use Cloudinary for your media storage.');
};

// Run the test
testCloudinaryConfig();