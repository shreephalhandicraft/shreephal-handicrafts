import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Heart, ShoppingBag } from "lucide-react";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// Enhanced product image component with fallback system
const ProductImage = ({ product, className }) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  useEffect(() => {
    if (product.image_url) {
      setCurrentImageUrl(product.image_url);
      setImageState("loading");
    } else {
      setImageState("no-image");
    }
  }, [product.image_url]);

  const handleImageLoad = () => {
    setImageState("loaded");
  };

  const handleImageError = () => {
    setImageState("error");
  };

  // Show icon fallback if no image, loading, or error
  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center group-hover:from-primary/15 group-hover:to-primary/10 transition-all duration-300`}
      >
        <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="text-xs text-primary/70 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-2">
          {product.title?.slice(0, 20) || "Product"}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Loading skeleton */}
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
        </div>
      )}

      {/* Actual image */}
      {currentImageUrl && (
        <img
          src={currentImageUrl}
          alt={product.title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* Subtle overlay for loaded images */}
      {imageState === "loaded" && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
      )}
    </div>
  );
};

export const ProductCard = ({ product, viewMode = "grid" }) => {
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const { toast } = useToast();

  const handleToggleFavourite = (e) => {
    e.preventDefault();
    if (isFavourite(product.id)) {
      removeFromFavourites(product.id);
      toast({
        title: "Removed from Favourites",
        description: `${product.title} has been removed from your favourites.`,
        duration: 3000,
      });
    } else {
      addToFavourites(product);
      toast({
        title: "Added to Favourites",
        description: `${product.title} has been added to your favourites.`,
        duration: 3000,
      });
    }
  };

  // Format price to Indian currency
  const formatPrice = (priceInCents) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(priceInCents);
  };

  const isNewProduct = (createdAt) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) > thirtyDaysAgo;
  };

  const categoryName = product.categories?.name || product.category_name || "Product";
  const categorySlug = product.categories?.slug || product.category_slug || "uncategorized";
  const categoryRating = product.categories?.rating || product.category_rating || null;

  // Grid view (default)
  if (viewMode === "grid") {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group relative border border-gray-100 hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <ProductImage product={product} className="w-full h-full" />

          {/* Badges */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-col gap-1 sm:gap-2 z-10">
            {isNewProduct(product.created_at) && (
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold shadow-lg">
                New
              </span>
            )}
            {!product.in_stock && (
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold shadow-lg">
                Sold Out
              </span>
            )}
          </div>

          {/* Favourite Button */}
          <button
            onClick={handleToggleFavourite}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1.5 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 group/fav z-10"
          >
            <Heart
              className={`h-3 w-3 sm:h-4 sm:w-4 transition-colors duration-200 ${
                isFavourite(product.id)
                  ? "text-red-500 fill-current"
                  : "text-gray-600 group-hover/fav:text-red-400"
              }`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Category & Rating */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full truncate max-w-[120px] sm:max-w-none">
              {categoryName}
            </span>
            {categoryRating && (
              <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500 fill-current" />
                <span className="text-xs text-yellow-700 ml-1 font-medium">
                  {categoryRating}
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
            {product.title}
          </h3>

          {/* Price & Action */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary truncate">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs sm:text-sm text-gray-500 line-through truncate">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>

            <Link
              to={`/category/${categorySlug}/products/${product.id}`}
              className="group/link shrink-0"
            >
              <Button
                size="sm"
                disabled={!product.in_stock}
                className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-200 ${
                  product.in_stock
                    ? "hover:shadow-lg hover:-translate-y-0.5"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="hidden sm:inline">
                  {product.in_stock ? "View Details" : "Out of Stock"}
                </span>
                <span className="sm:hidden">
                  {product.in_stock ? "View" : "Sold"}
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group relative border border-gray-100 hover:-translate-y-1">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Image */}
        <div className="relative w-full sm:w-48 aspect-square bg-gray-50 overflow-hidden rounded-lg shrink-0">
          <ProductImage product={product} className="w-full h-full" />

          {/* Favourite Button */}
          <button
            onClick={handleToggleFavourite}
            className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 group/fav z-10"
          >
            <Heart
              className={`h-4 w-4 transition-colors duration-200 ${
                isFavourite(product.id)
                  ? "text-red-500 fill-current"
                  : "text-gray-600 group-hover/fav:text-red-400"
              }`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Category & Badges */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {categoryName}
              </span>
              {isNewProduct(product.created_at) && (
                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  New
                </span>
              )}
              {!product.in_stock && (
                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  Sold Out
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-200">
              {product.title}
            </h3>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {product.description}
              </p>
            )}
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>

            <Link to={`/category/${categorySlug}/products/${product.id}`}>
              <Button
                disabled={!product.in_stock}
                className={`transition-all duration-200 ${
                  product.in_stock
                    ? "hover:shadow-lg hover:-translate-y-0.5"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {product.in_stock ? "View Details" : "Out of Stock"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
