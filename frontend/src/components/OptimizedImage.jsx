/**
 * OptimizedImage Component
 * Handles Cloudinary image optimization, lazy loading, and fallback states
 */

import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { getOptimizedImageUrl, ImagePresets } from '@/utils/cloudinaryUpload';

const OptimizedImage = ({ 
  src, 
  alt = 'Product Image', 
  preset = 'CARD',
  className = '',
  fallbackIcon: FallbackIcon = ShoppingBag,
  ...props 
}) => {
  const [imageState, setImageState] = useState('loading');
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  useEffect(() => {
    if (src) {
      // Use the preset to get optimized URL
      const presetConfig = ImagePresets[preset] || ImagePresets.CARD;
      const optimizedUrl = getOptimizedImageUrl(src, presetConfig);
      setCurrentImageUrl(optimizedUrl);
      setImageState('loading');
    } else {
      setImageState('no-image');
    }
  }, [src, preset]);

  const handleImageLoad = () => {
    setImageState('loaded');
  };

  const handleImageError = () => {
    setImageState('error');
  };

  // Show fallback icon if no image, loading, or error
  if (imageState === 'no-image' || imageState === 'error') {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center group`}
        {...props}
      >
        <FallbackIcon className="h-12 w-12 sm:h-16 sm:w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
        {alt && (
          <span className="text-xs text-primary/70 mt-2 font-medium text-center px-2 line-clamp-2">
            {alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`} {...props}>
      {/* Loading skeleton */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <FallbackIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
        </div>
      )}

      {/* Actual image */}
      {currentImageUrl && (
        <img
          src={currentImageUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* Subtle overlay for loaded images */}
      {imageState === 'loaded' && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
      )}
    </div>
  );
};

export default OptimizedImage;
