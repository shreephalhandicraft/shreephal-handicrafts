/**
 * Cloudinary Image Optimization Helpers
 * Provides automatic WebP conversion, responsive sizing, and quality optimization
 */

/**
 * Get optimized Cloudinary image URL with WebP format and responsive sizing
 * @param {string} imageUrl - Original Cloudinary image URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Desired width (default: auto)
 * @param {number} options.height - Desired height (default: auto)
 * @param {string} options.quality - Image quality: 'auto:best', 'auto:good', 'auto:low' (default: 'auto:good')
 * @param {string} options.crop - Crop mode: 'fill', 'fit', 'scale', 'crop' (default: 'fill')
 * @param {string} options.format - Force format: 'webp', 'avif', 'auto' (default: 'auto')
 * @returns {string} Optimized Cloudinary URL
 */
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl) return '';

  // Default options
  const {
    width,
    height,
    quality = 'auto:good',
    crop = 'fill',
    format = 'auto', // 'auto' will serve WebP to supporting browsers
  } = options;

  // Check if it's already a Cloudinary URL
  if (!imageUrl.includes('cloudinary.com')) {
    return imageUrl; // Return as-is if not Cloudinary
  }

  // Extract the base URL and image path
  const uploadIndex = imageUrl.indexOf('/upload/');
  if (uploadIndex === -1) return imageUrl;

  const baseUrl = imageUrl.substring(0, uploadIndex + 8); // Include '/upload/'
  const imagePath = imageUrl.substring(uploadIndex + 8);

  // Build transformation string
  const transformations = [];
  
  if (crop) transformations.push(`c_${crop}`);
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  // Add dpr_auto for retina displays
  transformations.push('dpr_auto');

  const transformString = transformations.join(',');

  return `${baseUrl}${transformString}/${imagePath}`;
};

/**
 * Get responsive image srcSet for different screen sizes
 * @param {string} imageUrl - Original Cloudinary image URL
 * @param {Array<number>} widths - Array of widths for srcSet (default: [320, 640, 768, 1024, 1280, 1536])
 * @returns {string} srcSet string for responsive images
 */
export const getResponsiveSrcSet = (imageUrl, widths = [320, 640, 768, 1024, 1280, 1536]) => {
  if (!imageUrl) return '';

  return widths
    .map(width => {
      const optimizedUrl = getOptimizedImageUrl(imageUrl, { width, format: 'auto', quality: 'auto:good' });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
};

/**
 * Get image sizes attribute for responsive images
 * @param {string} type - Image type: 'hero', 'card', 'thumbnail', 'full'
 * @returns {string} sizes attribute value
 */
export const getImageSizes = (type = 'card') => {
  const sizeMap = {
    hero: '100vw',
    card: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
    thumbnail: '(max-width: 640px) 150px, 200px',
    full: '100vw',
    banner: '100vw',
  };

  return sizeMap[type] || sizeMap.card;
};

/**
 * Preload critical images for better performance
 * @param {Array<string>} imageUrls - Array of critical image URLs
 */
export const preloadImages = (imageUrls = []) => {
  if (typeof window === 'undefined') return;

  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.type = 'image/webp';
    document.head.appendChild(link);
  });
};

/**
 * Get optimized thumbnail URL (small size, WebP)
 * @param {string} imageUrl - Original image URL
 * @returns {string} Optimized thumbnail URL
 */
export const getThumbnailUrl = (imageUrl) => {
  return getOptimizedImageUrl(imageUrl, {
    width: 150,
    height: 150,
    quality: 'auto:good',
    crop: 'fill',
    format: 'auto',
  });
};

/**
 * Get optimized card image URL (medium size, WebP)
 * @param {string} imageUrl - Original image URL
 * @returns {string} Optimized card image URL
 */
export const getCardImageUrl = (imageUrl) => {
  return getOptimizedImageUrl(imageUrl, {
    width: 400,
    height: 400,
    quality: 'auto:good',
    crop: 'fill',
    format: 'auto',
  });
};

/**
 * Get optimized hero/banner image URL (large size, WebP)
 * @param {string} imageUrl - Original image URL
 * @returns {string} Optimized hero image URL
 */
export const getHeroImageUrl = (imageUrl) => {
  return getOptimizedImageUrl(imageUrl, {
    width: 1920,
    quality: 'auto:best',
    format: 'auto',
  });
};
