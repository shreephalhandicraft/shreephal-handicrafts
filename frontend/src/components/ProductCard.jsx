import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Heart, ShoppingBag, Tag } from "lucide-react";
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
        className={`${className} bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 flex flex-col items-center justify-center group-hover:from-primary/20 group-hover:via-primary/10 group-hover:to-primary/20 transition-all duration-500`}
      >
        <div className="transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
          <ShoppingBag className="h-14 w-14 sm:h-20 sm:w-20 text-primary/70" />
        </div>
        <span className="text-xs sm:text-sm text-primary/70 mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-2">
          {product.title?.slice(0, 20) || "Product"}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden bg-gray-100`}>
      {/* Loading skeleton */}
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 sm:h-14 sm:w-14 text-gray-400/50 animate-pulse" />
        </div>
      )}

      {/* Actual image */}
      {currentImageUrl && (
        <img
          src={currentImageUrl}
          alt={product.title}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* Gradient overlay for loaded images */}
      {imageState === "loaded" && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (product.original_price && product.original_price > product.price) {
      const discount = ((product.original_price - product.price) / product.original_price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  // Calculate savings amount
  const getSavingsAmount = () => {
    if (product.original_price && product.original_price > product.price) {
      return product.original_price - product.price;
    }
    return 0;
  };

  // New product: only 7 days instead of 30
  const isNewProduct = (createdAt) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(createdAt) > sevenDaysAgo;
  };

  const categoryName = product.categories?.name || product.category_name || "Product";
  const categorySlug = product.categories?.slug || product.category_slug || "uncategorized";
  const categoryRating = product.categories?.rating || product.category_rating || null;
  
  const discountPercentage = getDiscountPercentage();
  const savingsAmount = getSavingsAmount();

  // Grid view (default)
  if (viewMode === "grid") {
    return (
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group relative border border-gray-100 hover:border-primary/20 hover:-translate-y-2">
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <ProductImage product={product} className="w-full h-full" />

          {/* Top Badges - Only critical info */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-2 z-10">
            {/* Discount Badge - Priority 1 */}
            {discountPercentage > 0 && (
              <span className="inline-flex items-center bg-gradient-to-r from-red-500 to-rose-600 text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm transform hover:scale-105 transition-transform">
                <Tag className="h-3 w-3 mr-1" />
                {discountPercentage}% OFF
              </span>
            )}
            
            {/* New Badge - Only if no discount and within 7 days */}
            {!discountPercentage && isNewProduct(product.created_at) && (
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm transform hover:scale-105 transition-transform">
                New
              </span>
            )}
            
            {/* Stock Status */}
            {!product.in_stock && (
              <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                Sold Out
              </span>
            )}
          </div>

          {/* Favourite Button - Enhanced with better tap target */}
          <button
            onClick={handleToggleFavourite}
            aria-label={isFavourite(product.id) ? "Remove from favourites" : "Add to favourites"}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2.5 sm:p-3 bg-white/95 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 group/fav z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Heart
              className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ${
                isFavourite(product.id)
                  ? "text-red-500 fill-current scale-110 animate-pulse"
                  : "text-gray-600 group-hover/fav:text-red-400 group-hover/fav:scale-110"
              }`}
            />
          </button>
        </div>

        {/* Content - Enhanced spacing and hierarchy */}
        <div className="p-5 sm:p-6 space-y-3">
          {/* Title - Prominent */}
          <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300 min-h-[3rem]">
            {product.title}
          </h3>

          {/* Pricing Section - Most prominent */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm sm:text-base text-gray-400 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>
            
            {/* Savings Display */}
            {savingsAmount > 0 && (
              <div className="inline-flex items-center bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                <span>You Save {formatPrice(savingsAmount)}!</span>
              </div>
            )}
          </div>

          {/* Category & Rating - Subtle bottom position */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-500 truncate max-w-[140px]">
              {categoryName}
            </span>
            {categoryRating && (
              <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-xs text-yellow-700 ml-1 font-semibold">
                  {categoryRating}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Link
            to={`/category/${categorySlug}/products/${product.id}`}
            className="block mt-4"
          >
            <Button
              size="lg"
              disabled={!product.in_stock}
              className={`w-full text-sm font-semibold transition-all duration-300 min-h-[44px] ${
                product.in_stock
                  ? "hover:shadow-lg hover:-translate-y-1 active:translate-y-0"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {product.in_stock ? "View Details →" : "Out of Stock"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // List view - Enhanced
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group relative border border-gray-100 hover:border-primary/20 hover:-translate-y-1">
      <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6">
        {/* Image */}
        <div className="relative w-full sm:w-56 aspect-square bg-gray-50 overflow-hidden rounded-xl shrink-0">
          <ProductImage product={product} className="w-full h-full" />

          {/* Badges for list view */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {discountPercentage > 0 && (
              <span className="inline-flex items-center bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                <Tag className="h-3 w-3 mr-1" />
                {discountPercentage}% OFF
              </span>
            )}
            {!discountPercentage && isNewProduct(product.created_at) && (
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                New
              </span>
            )}
            {!product.in_stock && (
              <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                Sold Out
              </span>
            )}
          </div>

          {/* Favourite Button */}
          <button
            onClick={handleToggleFavourite}
            aria-label={isFavourite(product.id) ? "Remove from favourites" : "Add to favourites"}
            className="absolute top-3 right-3 p-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 group/fav z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ${
                isFavourite(product.id)
                  ? "text-red-500 fill-current scale-110 animate-pulse"
                  : "text-gray-600 group-hover/fav:text-red-400 group-hover/fav:scale-110"
              }`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 leading-snug">
              {product.title}
            </h3>

            {/* Description */}
            {product.description && (
              <p className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Category & Rating */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500">
                {categoryName}
              </span>
              {categoryRating && (
                <div className="flex items-center bg-yellow-50 px-2.5 py-1 rounded-full">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                  <span className="text-sm text-yellow-700 ml-1 font-semibold">
                    {categoryRating}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
              {savingsAmount > 0 && (
                <div className="inline-flex items-center bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                  <span>You Save {formatPrice(savingsAmount)}!</span>
                </div>
              )}
            </div>

            <Link to={`/category/${categorySlug}/products/${product.id}`}>
              <Button
                size="lg"
                disabled={!product.in_stock}
                className={`text-sm px-6 py-3 font-semibold transition-all duration-300 min-h-[44px] whitespace-nowrap ${
                  product.in_stock
                    ? "hover:shadow-lg hover:-translate-y-1 active:translate-y-0"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {product.in_stock ? "View Details →" : "Out of Stock"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
