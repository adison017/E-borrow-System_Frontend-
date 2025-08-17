import { authFetch } from './api';
import { API_BASE } from './api';

/**
 * Upload single file to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} folder - The folder in Cloudinary (default: 'e-borrow/general')
 * @returns {Promise<Object>} Upload result
 */
const extractCloudinaryFields = (payload) => {
  if (!payload) return { url: undefined, secure_url: undefined, public_id: undefined };

  const candidates = [
    payload,
    payload.data,
    payload.result,
    payload.uploadResult,
    payload.resource,
  ];

  for (const obj of candidates) {
    if (obj && (obj.secure_url || obj.url)) {
      return {
        secure_url: obj.secure_url || obj.url,
        url: obj.secure_url || obj.url,
        public_id: obj.public_id || obj.asset_id || obj.publicId
      };
    }
  }

  // Sometimes API returns { url: '...', public_id: '...' } directly at root
  if (payload.url || payload.secureUrl || payload.secure_url) {
    const u = payload.secure_url || payload.secureUrl || payload.url;
    return { secure_url: u, url: u, public_id: payload.public_id };
  }

  // Handle arrays (upload-multiple or wrapped response)
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const r = extractCloudinaryFields(item);
      if (r.url) return r;
    }
  }

  // Handle new backend response format
  if (payload && typeof payload === 'object') {
    // Check if it's a successful upload result from backend
    if (payload.success && payload.data) {
      const data = payload.data;
      if (data.url || data.secure_url) {
        return {
          secure_url: data.secure_url || data.url,
          url: data.secure_url || data.url,
          public_id: data.public_id
        };
      }
    }
  }

  return { url: undefined, secure_url: undefined, public_id: undefined };
};

export const uploadFileToCloudinary = async (file, folder = 'e-borrow/general') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await authFetch(`${API_BASE}/cloudinary/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    const { url, secure_url, public_id } = extractCloudinaryFields(data);
    return { url: secure_url || url, secure_url: secure_url || url, public_id, original: data };
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

    const response = await authFetch(`${API_BASE}/cloudinary/upload-multiple`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Cloudinary upload response:', data);

    // Handle the new response format from backend
    if (data && data.success && Array.isArray(data.data)) {
      const results = data.data.map(d => {
        const { url, secure_url, public_id } = extractCloudinaryFields(d);
        return {
          url: secure_url || url,
          secure_url: secure_url || url,
          public_id,
          original: d,
          success: d.success !== false // Assume success unless explicitly false
        };
      });
      return results;
    }

    // Handle legacy array format
    if (Array.isArray(data)) {
      return data.map(d => {
        const { url, secure_url, public_id } = extractCloudinaryFields(d);
        return {
          url: secure_url || url,
          secure_url: secure_url || url,
          public_id,
          original: d,
          success: d.success !== false
        };
      });
    }

    // Sometimes wrapped in { results: [...] }
    if (Array.isArray(data?.results)) {
      return data.results.map(d => {
        const { url, secure_url, public_id } = extractCloudinaryFields(d);
        return {
          url: secure_url || url,
          secure_url: secure_url || url,
          public_id,
          original: d,
          success: d.success !== false
        };
      });
    }

    // Fallback single object
    const { url, secure_url, public_id } = extractCloudinaryFields(data);
    return [{
      url: secure_url || url,
      secure_url: secure_url || url,
      public_id,
      original: data,
      success: data.success !== false
    }];
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
    const response = await authFetch(`${API_BASE}/cloudinary/delete/${publicId}`, {
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
    const response = await authFetch(`${API_BASE}/cloudinary/config`);
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
    const response = await authFetch(`${API_BASE}/cloudinary/test-connection`);
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
    const response = await authFetch(`${API_BASE}/cloudinary/usage-stats`);
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
    const response = await authFetch(`${API_BASE}/cloudinary/create-folders`, {
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
    const response = await authFetch(`${API_BASE}/cloudinary/list-folders`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error listing Cloudinary folders:', error);
    throw error;
  }
};