import { useState, useEffect, useRef } from "react";
import { Package, Loader2, ZoomIn, ZoomOut } from "lucide-react";

// Simplified Cloudinary helper - single image approach
const getCloudinaryImageUrl = (imageUrl, transformation = "medium") => {
  if (!imageUrl) return null;

  if (imageUrl.includes("cloudinary.com")) {
    const publicIdMatch = imageUrl.match(
      /\/([^\/]+)\.(jpg|jpeg|png|webp|auto)$/i
    );
    if (publicIdMatch) {
      const publicId = publicIdMatch[1];
      const baseUrl =
        "https://res.cloudinary.com/Shrifal-Handicraft/image/upload";

      const transformations = {
        thumbnail: "c_fill,h_150,q_auto,w_150,f_auto",
        medium: "c_fill,h_400,q_auto,w_400,f_auto",
        large: "c_fill,h_800,q_auto,w_800,f_auto",
        hero: "c_fill,h_600,q_auto,w_600,f_auto",
        // Use the highest quality version for zoom
        zoom: "c_fill,h_1500,q_auto,w_1500,f_auto",
        original: "q_auto,f_auto",
      };

      return `${baseUrl}/${
        transformations[transformation] || transformations.medium
      }/${publicId}`;
    }
  }

  return imageUrl;
};

const ProductImage = ({
  imageUrl,
  alt,
  className,
  fallbackTitle,
  transformation = "hero",
  onClick,
  enableZoom = false,
  zoomStyle = "amazon",
}) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [zoomLevel, setZoomLevel] = useState(2);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [retryCount, setRetryCount] = useState(0);
  const [hasTriedOriginal, setHasTriedOriginal] = useState(false);

  const imageRef = useRef(null);
  const maxRetries = 2;
  const maxZoomLevel = 4; // Reduced since we're using same image
  const lensSize = 120;

  useEffect(() => {
    if (imageUrl) {
      const optimizedUrl = getCloudinaryImageUrl(imageUrl, transformation);
      setCurrentImageUrl(optimizedUrl);
      setImageState("loading");
      setRetryCount(0);
      setHasTriedOriginal(false);
    } else {
      setImageState("no-image");
    }
  }, [imageUrl, transformation]);

  const handleImageLoad = () => {
    setImageState("loaded");
    setRetryCount(0);
  };

  const handleImageError = () => {
    if (!hasTriedOriginal && imageUrl && currentImageUrl !== imageUrl) {
      setCurrentImageUrl(imageUrl);
      setHasTriedOriginal(true);
      setImageState("loading");
      return;
    }

    if (retryCount < maxRetries && imageUrl.includes("cloudinary.com")) {
      const fallbackUrl = getCloudinaryImageUrl(imageUrl, "original");
      if (fallbackUrl !== currentImageUrl) {
        setCurrentImageUrl(fallbackUrl);
        setRetryCount((prev) => prev + 1);
        setImageState("loading");
        return;
      }
    }

    setImageState("error");
  };

  const handleMouseMove = (e) => {
    if (!enableZoom || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values to prevent edge issues
    const clampedX = Math.max(0, Math.min(x, 100));
    const clampedY = Math.max(0, Math.min(y, 100));

    setMousePosition({ x: clampedX, y: clampedY });

    // Calculate lens position
    const lensX = e.clientX - rect.left - lensSize / 2;
    const lensY = e.clientY - rect.top - lensSize / 2;

    const boundedX = Math.max(0, Math.min(lensX, rect.width - lensSize));
    const boundedY = Math.max(0, Math.min(lensY, rect.height - lensSize));

    setLensPosition({ x: boundedX, y: boundedY });
  };

  const handleMouseEnter = () => {
    if (enableZoom) {
      setIsZoomed(true);
    }
  };

  const handleMouseLeave = () => {
    if (enableZoom) {
      setIsZoomed(false);
    }
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, maxZoomLevel));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  // Use the highest quality image we can get for zoom
  const getZoomImageUrl = () => {
    return getCloudinaryImageUrl(imageUrl, "zoom") || currentImageUrl;
  };

  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center cursor-pointer hover:from-primary/15 hover:to-primary/10 transition-all duration-300`}
        onClick={onClick}
      >
        <Package className="h-20 w-20 text-primary mb-3" />
        <span className="text-sm text-primary/70 font-medium text-center px-4">
          {fallbackTitle || "Product Image"}
        </span>
        <span className="text-xs text-primary/50 mt-1">No image available</span>
      </div>
    );
  }

  return (
    <>
      {/* Main Image Container */}
      <div
        className={`${className} relative overflow-hidden group`}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {imageState === "loading" && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          </div>
        )}

        {/* Zoom Controls */}
        {enableZoom && imageState === "loaded" && zoomStyle === "amazon" && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <button
              onClick={handleZoomIn}
              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              disabled={zoomLevel >= maxZoomLevel}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              disabled={zoomLevel <= 1}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
              {zoomLevel}x
            </div>
          </div>
        )}

        {/* Magnifier Lens (Amazon Style) */}
        {enableZoom &&
          zoomStyle === "amazon" &&
          isZoomed &&
          imageState === "loaded" && (
            <div
              className="absolute border-2 border-white bg-black/10 backdrop-blur-sm pointer-events-none z-30 shadow-lg"
              style={{
                width: `${lensSize}px`,
                height: `${lensSize}px`,
                left: `${lensPosition.x}px`,
                top: `${lensPosition.y}px`,
                borderRadius: "50%",
                boxShadow:
                  "0 0 15px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.2)",
              }}
            />
          )}

        {/* Main Image */}
        {currentImageUrl && (
          <img
            ref={imageRef}
            src={currentImageUrl}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-200 ${
              imageState === "loaded" ? "opacity-100" : "opacity-0"
            } ${
              enableZoom && isZoomed && zoomStyle === "hover"
                ? "scale-110 cursor-crosshair"
                : enableZoom && zoomStyle === "amazon"
                ? "cursor-crosshair"
                : "cursor-pointer"
            }`}
            style={
              enableZoom && isZoomed && zoomStyle === "hover"
                ? {
                    transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  }
                : {}
            }
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
    </>
  );
};

export default ProductImage;
export { getCloudinaryImageUrl };
