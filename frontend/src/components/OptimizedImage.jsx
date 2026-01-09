/**
 * OptimizedImage Component
 * 
 * Provides automatic image optimization with:
 * - WebP format with fallback to original
 * - Lazy loading with Intersection Observer
 * - Responsive srcSet for different screen sizes
 * - Loading skeleton/blur placeholder
 * - Proper width/height to prevent CLS
 * 
 * Usage:
 * <OptimizedImage
 *   src="/images/product.jpg"
 *   alt="Product name"
 *   width={800}
 *   height={600}
 *   priority={false}
 *   className="custom-class"
 * />
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  sizes = '100vw',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);

  // Generate WebP and fallback sources
  const getImageSources = () => {
    // If Cloudinary URL, use cloudinaryHelpers transformations
    if (src.includes('cloudinary.com')) {
      const baseUrl = src.split('/upload/')[0] + '/upload/';
      const imagePath = src.split('/upload/')[1];

      return {
        webp: `${baseUrl}f_webp,q_auto:good/${imagePath}`,
        original: src,
        srcSet: [
          `${baseUrl}f_webp,q_auto:good,w_400/${imagePath} 400w`,
          `${baseUrl}f_webp,q_auto:good,w_800/${imagePath} 800w`,
          `${baseUrl}f_webp,q_auto:good,w_1200/${imagePath} 1200w`,
        ].join(', '),
      };
    }

    // For local/static images, try WebP if available
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return {
      webp: webpSrc,
      original: src,
      srcSet: src,
    };
  };

  const sources = getImageSources();
  const aspectRatio = width && height ? (height / width) * 100 : 56.25; // Default 16:9

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{
        paddingBottom: `${aspectRatio}%`,
        width: width ? `${width}px` : '100%',
        maxWidth: '100%',
      }}
    >
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <picture className="absolute inset-0">
          {/* WebP source for modern browsers */}
          <source
            type="image/webp"
            srcSet={sources.srcSet}
            sizes={sizes}
          />

          {/* Fallback to original format */}
          <img
            src={sources.original}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              objectFit: 'cover',
            }}
          />
        </picture>
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  priority: PropTypes.bool,
  className: PropTypes.string,
  sizes: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default OptimizedImage;
