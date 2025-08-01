// components/ProductImageGallery.jsx
import { useState, useEffect } from "react";
import { Package, ZoomIn, Loader2 } from "lucide-react";

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
        zoom: "c_fill,h_1200,q_auto,w_1200,f_auto",
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
  enableZoom = false,
}) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (imageUrl) {
      const optimizedUrl = getCloudinaryImageUrl(imageUrl, transformation);
      setCurrentImageUrl(optimizedUrl);
      setImageState("loading");
    } else {
      setImageState("no-image");
    }
  }, [imageUrl, transformation]);

  const handleImageLoad = () => setImageState("loaded");
  const handleImageError = () => {
    if (currentImageUrl !== imageUrl && imageUrl) {
      setCurrentImageUrl(imageUrl);
      setImageState("loading");
    } else {
      setImageState("error");
    }
  };

  const handleMouseMove = (e) => {
    if (!enableZoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center`}
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
    <div
      className={`${className} relative overflow-hidden group`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => enableZoom && setIsZoomed(true)}
      onMouseLeave={() => enableZoom && setIsZoomed(false)}
    >
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}

      {enableZoom && imageState === "loaded" && (
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <ZoomIn className="h-4 w-4" />
        </div>
      )}

      {currentImageUrl && (
        <img
          src={
            isZoomed && enableZoom
              ? getCloudinaryImageUrl(imageUrl, "zoom")
              : currentImageUrl
          }
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          } ${
            enableZoom && isZoomed
              ? "scale-150 transform-gpu"
              : "hover:scale-105"
          }`}
          style={
            enableZoom && isZoomed
              ? { transformOrigin: `${mousePosition.x}% ${mousePosition.y}%` }
              : {}
          }
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
    </div>
  );
};

const ProductImageGallery = ({ product, productImages }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  const allImages =
    productImages.length > 0
      ? productImages
      : [
          {
            id: "main",
            image_url: product?.image_url,
            alt_text: product?.title,
            display_order: 0,
          },
        ];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
        <ProductImage
          imageUrl={allImages[selectedImage]?.image_url}
          alt={allImages[selectedImage]?.alt_text || product?.title}
          className="w-full h-full"
          fallbackTitle={product?.title}
          transformation="hero"
          enableZoom={true}
        />
      </div>

      {/* Thumbnail Images */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.slice(0, 4).map((img, index) => (
            <div
              key={img.id || index}
              className={`aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
                selectedImage === index
                  ? "border-primary ring-2 ring-primary/20 shadow-lg"
                  : "border-transparent hover:border-gray-300"
              }`}
              onClick={() => setSelectedImage(index)}
            >
              <ProductImage
                imageUrl={img.image_url}
                alt={img.alt_text || `${product?.title} ${index + 1}`}
                className="w-full h-full"
                fallbackTitle={`Image ${index + 1}`}
                transformation="thumbnail"
              />
            </div>
          ))}
        </div>
      )}

      {/* More Images Indicator */}
      {allImages.length > 4 && (
        <div className="text-center">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            +{allImages.length - 4} more images
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
