import { authFetch } from './api';

/**
 * Upload single file to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} folder - The folder in Cloudinary (default: 'e-borrow/general')
 * @returns {Promise<Object>} Upload result
 */
export const uploadFileToCloudinary = async (file, folder = 'e-borrow/general') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await authFetch('http://localhost:5000/api/cloudinary/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files to upload
 * @param {string} folder - The folder in Cloudinary (default: 'e-borrow/general')
 * @returns {Promise<Object>} Upload results
 */
export const uploadMultipleFilesToCloudinary = async (files, folder = 'e-borrow/general') => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder', folder);

    const response = await authFetch('http://localhost:5000/api/cloudinary/upload-multiple', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading multiple files to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise<Object>} Delete result
 */
export const deleteFileFromCloudinary = async (publicId) => {
  try {
    const response = await authFetch(`http://localhost:5000/api/cloudinary/delete/${publicId}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Transform Cloudinary image URL
 * @param {string} url - Original Cloudinary URL
 * @param {Object} transformations - Transformation options
 * @returns {string} Transformed URL
 */
export const transformCloudinaryImage = (url, transformations = {}) => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Default transformations
  const defaultTransformations = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...transformations
  };

  // Build transformation string
  const transformStr = Object.entries(defaultTransformations)
    .map(([key, value]) => `${key.charAt(0)}_${value}`)
    .join(',');

  // Insert transformation into URL
  const parts = url.split('/upload/');
  if (parts.length === 2) {
    return `${parts[0]}/upload/${transformStr}/${parts[1]}`;
  }

  return url;
};

/**
 * Get optimized Cloudinary URL for different sizes
 * @param {string} url - Original Cloudinary URL
 * @param {string} size - Size preset ('thumbnail', 'small', 'medium', 'large')
 * @returns {string} Optimized URL
 */
export const getOptimizedCloudinaryUrl = (url, size = 'medium') => {
  const sizePresets = {
    thumbnail: { width: 150, height: 150, crop: 'fill' },
    small: { width: 300, height: 300, crop: 'fill' },
    medium: { width: 600, height: 600, crop: 'limit' },
    large: { width: 1200, height: 1200, crop: 'limit' }
  };

  const preset = sizePresets[size] || sizePresets.medium;
  return transformCloudinaryImage(url, preset);
};

/**
 * Check if URL is from Cloudinary
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is from Cloudinary
 */
export const isCloudinaryUrl = (url) => {
  return url && url.includes('cloudinary.com');
};

/**
 * Get Cloudinary config and status
 * @returns {Promise<Object>} Cloudinary configuration
 */
export const getCloudinaryConfig = async () => {
  try {
    const response = await authFetch('http://localhost:5000/api/cloudinary/config');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting Cloudinary config:', error);
    throw error;
  }
};

/**
 * Test Cloudinary connection
 * @returns {Promise<Object>} Connection test result
 */
export const testCloudinaryConnection = async () => {
  try {
    const response = await authFetch('http://localhost:5000/api/cloudinary/test-connection');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error testing Cloudinary connection:', error);
    throw error;
  }
};

/**
 * Get Cloudinary usage statistics
 * @returns {Promise<Object>} Usage statistics
 */
export const getCloudinaryUsageStats = async () => {
  try {
    const response = await authFetch('http://localhost:5000/api/cloudinary/usage-stats');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting Cloudinary usage stats:', error);
    throw error;
  }
};

/**
 * Create folder structure in Cloudinary
 * @returns {Promise<Object>} Folder creation result
 */
export const createCloudinaryFolders = async () => {
  try {
    const response = await authFetch('http://localhost:5000/api/cloudinary/create-folders', {
      method: 'POST'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating Cloudinary folders:', error);
    throw error;
  }
};

/**
 * List folders in Cloudinary
 * @returns {Promise<Object>} Folder list result
 */
export const listCloudinaryFolders = async () => {
  try {
    const response = await authFetch('http://localhost:5000/api/cloudinary/list-folders');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error listing Cloudinary folders:', error);
    throw error;
  }
};