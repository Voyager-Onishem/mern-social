import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure the video assets directory
const assetsDirectory = path.join(__dirname, '../public/assets');

/**
 * GET /videos/:filename - Stream a video file with proper range support
 * Handles partial content requests for better video streaming
 */
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(assetsDirectory, filename);

  // Check if file exists
  fs.stat(videoPath, (err, stats) => {
    if (err) {
      console.error(`Error accessing video file ${filename}:`, err);
      return res.status(404).send('Video not found');
    }

    // Get file size
    const fileSize = stats.size;
    
    // Parse Range header
    const range = req.headers.range;
    
    if (range) {
      // Range request - partial content
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      // Create read stream for the specific chunk
      const fileStream = fs.createReadStream(videoPath, { start, end });
      
      // Set appropriate headers for range request
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4', // You might want to determine this dynamically
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });
      
      // Pipe the file stream to the response
      fileStream.pipe(res);
      
      // Handle errors
      fileStream.on('error', (streamErr) => {
        console.error(`Error streaming file ${filename}:`, streamErr);
        if (!res.headersSent) {
          res.status(500).send('Error streaming video');
        }
      });
    } else {
      // No range - send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4', // You might want to determine this dynamically
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });
      
      // Create read stream for the entire file
      const fileStream = fs.createReadStream(videoPath);
      
      // Pipe the file stream to the response
      fileStream.pipe(res);
      
      // Handle errors
      fileStream.on('error', (streamErr) => {
        console.error(`Error streaming file ${filename}:`, streamErr);
        if (!res.headersSent) {
          res.status(500).send('Error streaming video');
        }
      });
    }
  });
});

export default router;