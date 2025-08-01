import { useState } from "react";
import ProductImage from "./ProductImage";

const ImageGallery = ({ product, productImages, enableAmazonZoom = true }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showZoomContainer, setShowZoomContainer] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [zoomLevel, setZoomLevel] = useState(2);

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

  const handleImageMouseMove = (e, imageElement) => {
    if (!enableAmazonZoom || !imageElement) return;

    const rect = imageElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(x, 100));
    const clampedY = Math.max(0, Math.min(y, 100));

    setMousePosition({ x: clampedX, y: clampedY });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image Container - Responsive Layout */}
      <div className="relative">
        {/* Main Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-lg w-full max-w-lg mx-auto lg:mx-0">
          <div
            className="w-full h-full relative group"
            onMouseMove={(e) => {
              const img = e.currentTarget.querySelector("img");
              if (img) handleImageMouseMove(e, img);
            }}
            onMouseEnter={() => enableAmazonZoom && setShowZoomContainer(true)}
            onMouseLeave={() => enableAmazonZoom && setShowZoomContainer(false)}
          >
            <ProductImage
              imageUrl={allImages[selectedImage]?.image_url}
              alt={allImages[selectedImage]?.alt_text || product?.title}
              className="w-full h-full"
              fallbackTitle={product?.title}
              transformation="hero"
              enableZoom={false}
              zoomStyle="none"
            />

            {/* Custom Lens - Only show on larger screens */}
            {enableAmazonZoom && showZoomContainer && (
              <div
                className="absolute border-2 border-white bg-black/10 backdrop-blur-sm pointer-events-none z-30 shadow-lg hidden lg:block"
                style={{
                  width: "100px",
                  height: "100px",
                  left: `calc(${mousePosition.x}% - 50px)`,
                  top: `calc(${mousePosition.y}% - 50px)`,
                  borderRadius: "50%",
                  boxShadow:
                    "0 0 15px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.2)",
                }}
              />
            )}

            {/* Zoom Controls - Smaller and better positioned */}
            {enableAmazonZoom && (
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 lg:top-4 lg:right-4 lg:gap-2">
                <button
                  onClick={handleZoomIn}
                  className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors lg:p-2"
                  disabled={zoomLevel >= 4}
                >
                  <svg
                    className="h-3 w-3 lg:h-4 lg:w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleZoomOut}
                  className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors lg:p-2"
                  disabled={zoomLevel <= 1}
                >
                  <svg
                    className="h-3 w-3 lg:h-4 lg:w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                    />
                  </svg>
                </button>
                <div className="bg-black/50 text-white px-1.5 py-0.5 rounded text-xs lg:px-2 lg:py-1">
                  {zoomLevel}x
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom Container - Positioned as overlay on large screens */}
        {enableAmazonZoom && (
          <div
            className={`
              hidden lg:block absolute top-0 left-full ml-4 
              w-80 h-80 xl:w-96 xl:h-96 
              border border-gray-300 rounded-lg overflow-hidden 
              bg-white shadow-lg transition-opacity duration-200 z-40
              ${
                showZoomContainer
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }
            `}
          >
            <div
              className="w-full h-full bg-cover bg-no-repeat transition-all duration-100 ease-out"
              style={{
                backgroundImage: showZoomContainer
                  ? `url(${allImages[selectedImage]?.image_url})`
                  : "none",
                backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                backgroundSize: `${zoomLevel * 100}%`,
              }}
            />
            {/* Zoom info overlay */}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {zoomLevel}x zoom
            </div>
          </div>
        )}

        {/* Mobile Zoom Modal - Full screen overlay for mobile */}
        {enableAmazonZoom && showZoomContainer && (
          <div className="lg:hidden fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-lg max-h-96">
              <button
                onClick={() => setShowZoomContainer(false)}
                className="absolute top-2 right-2 bg-white/20 text-white p-2 rounded-full z-10"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat rounded-lg"
                style={{
                  backgroundImage: `url(${allImages[selectedImage]?.image_url})`,
                  backgroundSize: `${zoomLevel * 150}%`,
                  backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Grid - Responsive */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-w-lg mx-auto lg:mx-0">
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
                enableZoom={false}
              />
            </div>
          ))}
        </div>
      )}

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

export default ImageGallery;
