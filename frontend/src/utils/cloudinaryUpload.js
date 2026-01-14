/**
 * Centralized Cloudinary Upload Utility
 * Enforces folder structure and naming conventions for organized media management
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'Shrifal-Handicraft';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Cloudinary folder structure for organized media
 */
export const CloudinaryFolders = {
  PRODUCTS: 'shreephal-handicrafts/products',
  CATEGORIES: 'shreephal-handicrafts/categories',
  BANNERS: 'shreephal-handicrafts/banners',
  CUSTOMIZATIONS: 'shreephal-handicrafts/customizations/orders',
  TEMP: 'shreephal-handicrafts/temp'
};

/**
 * Image transformation presets for different use cases
 */
export const ImagePresets = {
  THUMBNAIL: { width: 200, height: 200, quality: 'auto:low', crop: 'thumb' },
  CARD: { width: 400, height: 400, quality: 'auto:good', crop: 'fill' },
  DETAIL: { width: 800, height: 800, quality: 'auto:best', crop: 'fit' },
  HERO: { width: 1200, height: 600, quality: 'auto:best', crop: 'fill' },
  BANNER: { width: 1920, height: 600, quality: 'auto:best', crop: 'fill' }
};

/**
 * Generate structured public ID with naming convention
 * @param {string} folder - Cloudinary folder from CloudinaryFolders
 * @param {string} identifier - Unique identifier (catalog_number, category_slug, etc)
 * @param {string} suffix - Optional suffix (main, 01, 02, etc)
 * @returns {string} Formatted public ID
 */
export const generatePublicId = (folder, identifier, suffix = '') => {
  const sanitizedIdentifier = identifier.replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeSuffix = suffix ? `_${suffix}` : '';
  return `${folder}/${sanitizedIdentifier}${safeSuffix}`;
};

/**
 * Upload image to Cloudinary with structured folder organization
 * Uses backend API for secure uploads
 * 
 * @param {File} file - Image file to upload
 * @param {string} folder - Cloudinary folder from CloudinaryFolders
 * @param {string} identifier - Unique identifier (catalog_number, category_slug, etc)
 * @param {string} suffix - Optional suffix (main, 01, 02, etc)
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadToCloudinary = async (file, folder, identifier, suffix = '') => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    // Add metadata for structured upload
    const publicId = generatePublicId(folder, identifier, suffix);
    formData.append('folder', folder);
    formData.append('publicId', publicId);
    
    const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    return {
      url: result.data.url,
      publicId: result.data.cloudinaryPublicId,
      format: result.data.format || 'jpg',
      width: result.data.width,
      height: result.data.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple images with sequential naming
 * @param {FileList|Array<File>} files - Array of image files
 * @param {string} folder - Cloudinary folder
 * @param {string} identifier - Base identifier
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, folder, identifier) => {
  const fileArray = Array.from(files);
  const uploadPromises = fileArray.map((file, index) => {
    const suffix = index === 0 ? 'main' : String(index).padStart(2, '0');
    return uploadToCloudinary(file, folder, identifier, suffix);
  });
  
  return Promise.all(uploadPromises);
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID or full URL
 * @param {Object} preset - Transformation preset from ImagePresets
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (publicId, preset = ImagePresets.CARD) => {
  // If it's already a full URL, extract public ID
  let cleanPublicId = publicId;
  if (publicId.includes('cloudinary.com')) {
    const match = publicId.match(/\/upload\/(?:v\d+\/)?(.*?)(?:\.[^.]+)?$/);
    if (match) {
      cleanPublicId = match[1];
    } else {
      return publicId; // Return as-is if can't parse
    }
  }
  
  const { width, height, quality, crop } = preset;
  const transformations = [];
  
  if (crop) transformations.push(`c_${crop}`);
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  transformations.push('f_auto'); // Auto format (WebP for supported browsers)
  
  const transformString = transformations.join(',');
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${cleanPublicId}`;
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/upload/image/${publicId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Helper to get product image folder
 * @param {string} categorySlug - Product category slug
 * @returns {string} Full folder path
 */
export const getProductImageFolder = (categorySlug) => {
  return `${CloudinaryFolders.PRODUCTS}/${categorySlug}`;
};

/**
 * Helper to get customization upload folder
 * @param {string} orderId - Order ID
 * @returns {string} Full folder path
 */
export const getCustomizationFolder = (orderId) => {
  return `${CloudinaryFolders.CUSTOMIZATIONS}/${orderId}`;
};
