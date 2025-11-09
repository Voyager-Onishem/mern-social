// Unified media storage service that abstracts local vs cloud storage
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

dotenv.config();

const USE_CLOUD_STORAGE = process.env.USE_CLOUD_STORAGE === 'true';

// Cloudinary Configuration (only if using cloud storage)
if (USE_CLOUD_STORAGE) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Media Storage Service
 * Provides a unified interface for both local and cloud storage
 */
class MediaStorageService {
  constructor() {
    this.storageType = USE_CLOUD_STORAGE ? 'cloud' : 'local';
    console.log(`MediaStorageService initialized with ${this.storageType} storage`);
  }

  /**
   * Get the storage type being used
   */
  getStorageType() {
    return this.storageType;
  }

  /**
   * Check if using cloud storage
   */
  isCloudStorage() {
    return this.storageType === 'cloud';
  }

  /**
   * Get the public URL for a file
   * @param {Object|String} file - File object from multer or filename string
   * @returns {String} Public URL
   */
  getPublicUrl(file) {
    if (!file) return null;

    // If it's already a URL string, return it
    if (typeof file === 'string') {
      if (file.startsWith('http')) return file;
      if (file.startsWith('//')) return `https:${file}`;
      
      // For local storage, return as-is (will be served via /assets endpoint)
      return file;
    }

    // If it's a file object from multer
    if (this.isCloudStorage()) {
      // Cloud storage - extract URL from Cloudinary response
      if (file.path) {
        if (file.path.startsWith('http')) return file.path;
        if (file.path.startsWith('//')) return `https:${file.path}`;
        return `https://${file.path}`;
      }
      
      // Fallback to secure_url or url
      return file.secure_url || file.url || null;
    } else {
      // Local storage - return filename (served via /assets)
      return file.filename || file.path || null;
    }
  }

  /**
   * Delete a file from storage
   * @param {String} filePathOrUrl - File path (local) or URL (cloud)
   * @returns {Promise<Boolean>} Success status
   */
  async deleteFile(filePathOrUrl) {
    if (!filePathOrUrl) return false;

    try {
      if (this.isCloudStorage()) {
        // Extract public_id from Cloudinary URL
        const publicId = this.extractCloudinaryPublicId(filePathOrUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
          return true;
        }
        return false;
      } else {
        // Local storage - delete file from disk
        const filePath = path.join(process.cwd(), 'public', 'assets', filePathOrUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param {String} url - Cloudinary URL
   * @returns {String|null} Public ID
   */
  extractCloudinaryPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) return null;

    try {
      // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{version}/{public_id}.{format}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    } catch (error) {
      console.error('Error extracting public_id:', error);
      return null;
    }
  }

  /**
   * Process uploaded file and return standardized response
   * @param {Object} file - Multer file object
   * @returns {Object} Processed file info
   */
  processUploadedFile(file) {
    if (!file) return null;

    return {
      filename: this.getPublicUrl(file),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageType: this.storageType,
      url: this.getPublicUrl(file) // Alias for convenience
    };
  }

  /**
   * Process multiple uploaded files
   * @param {Array} files - Array of multer file objects
   * @returns {Array} Processed file info
   */
  processUploadedFiles(files) {
    if (!files || !Array.isArray(files)) return [];
    return files.map(file => this.processUploadedFile(file));
  }

  /**
   * Get storage configuration info (for debugging/monitoring)
   */
  getStorageInfo() {
    return {
      type: this.storageType,
      isCloud: this.isCloudStorage(),
      cloudName: USE_CLOUD_STORAGE ? process.env.CLOUDINARY_CLOUD_NAME : null,
      maxFileSize: process.env.MAX_FILE_SIZE_MB || '25'
    };
  }
}

// Export singleton instance
export const mediaStorage = new MediaStorageService();

// Export class for testing
export { MediaStorageService };

// Helper functions for backward compatibility
export const getPublicUrl = (file) => mediaStorage.getPublicUrl(file);
export const deleteFile = (filePathOrUrl) => mediaStorage.deleteFile(filePathOrUrl);
