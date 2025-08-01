import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Star,
  Heart,
  ImageOff,
  Package,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// Cloudinary helper function
const getCloudinaryImageUrl = (imageUrl, transformation = "medium") => {
  if (!imageUrl) return null;

  // If it's already a Cloudinary URL, apply transformations
  if (imageUrl.includes("cloudinary.com")) {
    // Extract public_id from existing Cloudinary URL
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
        large: "c_fill,h_600,q_auto,w_600,f_auto",
        original: "q_auto,f_auto",
      };

      return `${baseUrl}/${
        transformations[transformation] || transformations.medium
      }/${publicId}`;
    }
  }

  return imageUrl; // Return original if not Cloudinary
};

// Enhanced product image component with fallback system
const ProductImage = ({ product, className }) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  useEffect(() => {
    if (product.optimized_image_url) {
      setCurrentImageUrl(product.optimized_image_url);
      setImageState("loading");
    } else {
      setImageState("no-image");
    }
  }, [product.optimized_image_url]);

  const handleImageLoad = () => {
    setImageState("loaded");
  };

  const handleImageError = () => {
    if (currentImageUrl === product.optimized_image_url && product.image_url) {
      // Try original URL
      setCurrentImageUrl(product.image_url);
      setImageState("loading");
    } else if (currentImageUrl === product.image_url && product.thumbnail_url) {
      // Try thumbnail
      setCurrentImageUrl(product.thumbnail_url);
      setImageState("loading");
    } else {
      // Show fallback icon
      setImageState("error");
    }
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

export const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select(
            `
            *,
            categories (
              name,
              slug,
              rating
            )
          `
          )
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) throw error;

        const transformedData = data.map((product) => ({
          ...product,
          category_name: product.categories?.name || "Uncategorized",
          category_slug: product.categories?.slug || "uncategorized",
          category_rating: product.categories?.rating || null,
          // Process image URLs for Cloudinary
          optimized_image_url: getCloudinaryImageUrl(
            product.image_url,
            "medium"
          ),
          thumbnail_url: getCloudinaryImageUrl(product.image_url, "thumbnail"),
        }));

        setFeaturedProducts(transformedData);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleToggleFavourite = (product) => {
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
    const price = priceInCents / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const isNewProduct = (createdAt) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) > thirtyDaysAgo;
  };

  // Enhanced loading skeleton
  const LoadingSkeleton = () => (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-60 sm:w-80 mx-auto mb-4 animate-pulse"></div>
          <div className="h-5 sm:h-6 bg-gray-200 rounded-lg w-80 sm:w-96 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              </div>
              <div className="p-4 sm:p-6">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mb-2 animate-pulse"></div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 sm:h-8 bg-gray-200 rounded w-14 sm:w-16 animate-pulse"></div>
                  <div className="h-8 sm:h-9 bg-gray-200 rounded w-20 sm:w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-red-50 to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 max-w-sm sm:max-w-md mx-auto">
            <div className="bg-gradient-to-br from-red-100 to-red-200 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageOff className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 max-w-sm sm:max-w-md mx-auto">
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No Featured Products Yet
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              We're working on adding amazing products for you!
            </p>
            <Link to="/shop">
              <Button variant="outline" size="sm" className="sm:text-base">
                Browse All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center bg-primary/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
            <span className="text-xs sm:text-sm font-medium text-primary">
              Featured Collection
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
            Featured Products
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-xl lg:max-w-2xl mx-auto leading-relaxed px-4">
            Check out our most popular items, loved by customers for their
            quality and personalization options.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group relative border border-gray-100 hover:-translate-y-1"
            >
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
                  onClick={() => handleToggleFavourite(product)}
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
                    {product.category_name}
                  </span>
                  {product.category_rating && (
                    <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-yellow-700 ml-1 font-medium">
                        {product.category_rating}
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
                    {product.original_price &&
                      product.original_price > product.price && (
                        <span className="text-xs sm:text-sm text-gray-500 line-through truncate">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                  </div>

                  <Link
                    to={`/category/${product.category_slug}/products/${product.id}`}
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
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 sm:mt-16">
          <div className="inline-flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
              Discover more amazing products in our collection
            </p>
            <Link to="/shop">
              <Button
                size="lg"
                variant="outline"
                className="border-2 hover:border-primary hover:bg-primary hover:text-white transition-all duration-300 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
