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
  
  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove any leading slash
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
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