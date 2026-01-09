import { useState } from 'react';

/**
 * OptimizedImage Component
 * Provides lazy loading, responsive images, and loading states
 */
export const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(e);
  };

  // Fallback image
  const fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E';

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        src={hasError ? fallbackSrc : src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`
          ${className}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
        `}
        {...props}
      />
    </div>
  );
};

/**
 * CloudinaryImage Component
 * Optimized for Cloudinary URLs with automatic transformations
 */
export const CloudinaryImage = ({
  src,
  alt,
  width = 800,
  height,
  quality = 'auto',
  format = 'auto',
  crop = 'fill',
  ...props
}) => {
  // Transform Cloudinary URL for optimization
  const getOptimizedUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;

    const transformations = [
      `w_${width}`,
      height && `h_${height}`,
      `c_${crop}`,
      `q_${quality}`,
      `f_${format}`,
      'fl_progressive',
      'fl_lossy',
    ]
      .filter(Boolean)
      .join(',');

    return url.replace('/upload/', `/upload/${transformations}/`);
  };

  return (
    <OptimizedImage
      src={getOptimizedUrl(src)}
      alt={alt}
      width={width}
      height={height}
      {...props}
    />
  );
};