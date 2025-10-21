/**
 * Utility functions for handling media paths and URLs
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001';

/**
 * Get the appropriate URL for a media file
 * @param {string} path - The relative path to the media file
 * @param {object} options - Options for the URL
 * @param {boolean} options.useVideoEndpoint - Use the video endpoint for videos
 * @returns {string} The complete URL to the media file
 */
export const getMediaUrl = (path, options = {}) => {
  if (!path) return '';
  
  // Debug log to trace the path coming in
  console.log('getMediaUrl received path:', path);
  
  // Fix incorrectly formatted URLs that have the local server path prepended to Cloudinary URLs
  if (path && path.includes('/assets/https://')) {
    // Extract the actual Cloudinary URL part
    const cloudinaryUrlMatch = path.match(/(https:\/\/.*cloudinary\.com\/.*)/);
    if (cloudinaryUrlMatch && cloudinaryUrlMatch[1]) {
      return cloudinaryUrlMatch[1];
    }
  }
  
  // If it's already a full URL (including Cloudinary URLs), return it directly
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it contains cloudinary.com anywhere, it's probably a cloudinary URL
  // This fixes cases where URLs are stored without protocol
  if (path && path.includes('cloudinary.com')) {
    // Ensure it has https:// prefix
    return path.startsWith('//') ? `https:${path}` : 
           path.startsWith('res.cloudinary.com') ? `https://${path}` : 
           `https://${path}`;
  }
  
  // Remove any leading slash
  const cleanPath = path ? (path.startsWith('/') ? path.substring(1) : path) : '';
  
  // Check if it's a video and should use the video endpoint
  if (options.useVideoEndpoint && isVideoFile(cleanPath)) {
    // Use the video endpoint for better streaming
    const filename = cleanPath.split('/').pop();
    return `${API_BASE_URL}/videos/${filename}`;
  }
  
  // Normal asset path
  return `${API_BASE_URL}/assets/${cleanPath}`;
};

/**
 * Check if a file is a video based on its extension
 * @param {string} path - The path to check
 * @returns {boolean} True if the path is a video file
 */
export const isVideoFile = (path) => {
  if (!path) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.ogg', '.avi'];
  return videoExtensions.some(ext => path.toLowerCase().endsWith(ext));
};

/**
 * Check if a URL is from our own API
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL is from our API
 */
export const isApiUrl = (url) => {
  if (!url) return false;
  
  // Check if it's a Cloudinary URL (should be treated as external)
  if (url.includes('cloudinary.com/')) {
    return false;
  }
  
  return url.startsWith(API_BASE_URL) || url.startsWith('/assets/');
};

/**
 * Get a URL for an image with a fallback
 * @param {string} path - The path to the image
 * @param {string} fallback - Fallback image path to use if the main one fails
 * @returns {string} The image URL
 */
export const getImageUrlWithFallback = (path, fallback = 'default-avatar.png') => {
  return path ? getMediaUrl(path) : getMediaUrl(fallback);
};

export default {
  getMediaUrl,
  isVideoFile,
  isApiUrl,
  getImageUrlWithFallback,
};