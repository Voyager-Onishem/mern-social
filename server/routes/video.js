import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyToken } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Basic video streaming endpoint for mp4 files
router.get('/:filename', verifyToken, (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, '../public/assets', filename);
  
  // Check if file exists
  fs.stat(videoPath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).send('Video not found');
      }
      return res.status(500).send('Error accessing video');
    }
    
    // Get file size
    const fileSize = stats.size;
    const range = req.headers.range;
    
    // Handle range requests (for video seeking)
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      
      // Create read stream for the requested chunk
      const file = fs.createReadStream(videoPath, { start, end });
      
      // Set response headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      });
      
      // Pipe the file stream to response
      file.pipe(res);
    } else {
      // Full content response
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      });
      
      // Create read stream for the entire file
      const file = fs.createReadStream(videoPath);
      
      // Pipe the file stream to response
      file.pipe(res);
    }
  });
});

// Health check endpoint for video service
router.get('/health/check', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Video streaming service is running'
  });
});

export default router;