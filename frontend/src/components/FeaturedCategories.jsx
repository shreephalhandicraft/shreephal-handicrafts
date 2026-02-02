import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Award,
  Image,
  Key,
  Calendar,
  Package,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

// Icon mapping based on category slug
const iconMap = {
  trophies: Award,
  "photo-frames": Image,
  "key-holders": Key,
  calendars: Calendar,
  default: Package,
};

// Default descriptions for categories
const defaultDescriptions = {
  trophies: "Championship trophies, awards, and recognition pieces",
  "photo-frames": "Custom photo frames for your precious memories",
  "key-holders": "Personalized key holders for home and office",
  calendars: "Custom calendars with your favorite photos",
};

// Cloudinary helper function
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
        thumbnail: "c_fill,h_200,q_auto,w_200,f_auto",
        medium: "c_fill,h_400,q_auto,w_400,f_auto",
        large: "c_fill,h_600,q_auto,w_600,f_auto",
        square: "c_fill,h_300,q_auto,w_300,f_auto",
        original: "q_auto,f_auto",
      };

      return `${baseUrl}/${
        transformations[transformation] || transformations.square
      }/${publicId}`;
    }
  }

  return imageUrl;
};

// Enhanced category image component with gradient overlay
const CategoryImage = ({ category, className }) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  const IconComponent = iconMap[category.slug] || iconMap.default;

  useEffect(() => {
    if (category.image) {
      const optimizedUrl = getCloudinaryImageUrl(category.image, "square");
      setCurrentImageUrl(optimizedUrl);
      setImageState("loading");
    } else {
      setImageState("no-image");
    }
  }, [category.image]);

  const handleImageLoad = () => {
    setImageState("loaded");
  };

  const handleImageError = () => {
    if (currentImageUrl !== category.image && category.image) {
      setCurrentImageUrl(category.image);
    } else {
      setImageState("error");
    }
  };

  // Show icon if no image or error
  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 flex flex-col items-center justify-center group-hover:from-primary/20 group-hover:via-primary/10 group-hover:to-primary/20 transition-all duration-500`}
      >
        <IconComponent className="h-20 w-20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
        <span className="text-sm text-primary/70 mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {category.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Loading skeleton */}
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <IconComponent className="h-12 w-12 text-gray-400" />
        </div>
      )}

      {/* Actual image */}
      {currentImageUrl && (
        <img
          src={currentImageUrl}
          alt={category.name}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* Gradient overlay for better text readability */}
      {imageState === "loaded" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          {/* Icon overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500 flex items-center justify-center">
            <IconComponent className="h-16 w-16 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 group-hover:rotate-6 transition-all duration-500" />
          </div>
        </>
      )}
    </div>
  );
};

export const FeaturedCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch featured categories
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, price, image, rating, featured")
          .eq("featured", true)
          .order("name", { ascending: true });

        if (error) throw error;

        // If no featured categories, fetch all as fallback
        if (!data || data.length === 0) {
          const { data: allData, error: allError } = await supabase
            .from("categories")
            .select("id, name, slug, price, image, rating, featured")
            .order("name", { ascending: true })
            .limit(4);

          if (allError) throw allError;

          // Fetch product counts for all categories
          const categoriesWithCounts = await Promise.all(
            (allData || []).map(async (category) => {
              const { count } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("category_id", category.id);
              return { ...category, product_count: count || 0 };
            })
          );

          setCategories(categoriesWithCounts);
        } else {
          // Fetch product counts for featured categories
          const categoriesWithCounts = await Promise.all(
            data.map(async (category) => {
              const { count } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("category_id", category.id);
              return { ...category, product_count: count || 0 };
            })
          );

          setCategories(categoriesWithCounts);
        }
      } catch (err) {
        console.error("Error in fetchFeaturedCategories:", err);
        setError(err.message || "Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCategories();
  }, []);

  // Enhanced loading skeleton
  const LoadingSkeleton = () => (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-60 sm:w-80 mx-auto mb-4 animate-pulse"></div>
          <div className="h-5 sm:h-6 bg-gray-200 rounded-lg w-80 sm:w-96 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              <div className="p-5 sm:p-6">
                <div className="h-6 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
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
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-red-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 max-w-sm sm:max-w-md mx-auto">
            <div className="bg-gradient-to-br from-red-100 to-red-200 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
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

  if (categories.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 max-w-sm sm:max-w-md mx-auto">
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No categories available
            </h3>
            <p className="text-gray-600 text-sm">
              Please check back later or contact us for more information.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-white via-gray-50/50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center bg-primary/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
            <span className="text-xs sm:text-sm font-medium text-primary">
              Explore Categories
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
            Our Product Categories
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-xl lg:max-w-2xl mx-auto leading-relaxed px-4">
            Discover our wide range of customizable products, each crafted with
            attention to detail and designed to celebrate your unique moments.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {categories.map((category) => {
            const description =
              defaultDescriptions[category.slug] ||
              "Customizable products for your needs";

            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}/products`}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-primary/20 hover:-translate-y-2"
              >
                {/* Image/Icon Container */}
                <CategoryImage category={category} className="aspect-square" />

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-3">
                  {/* Category Name */}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </h3>

                  {/* Product Count */}
                  {category.product_count !== undefined && (
                    <p className="text-sm text-gray-500 font-medium">
                      {category.product_count} {category.product_count === 1 ? 'Product' : 'Products'} Available
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {description}
                  </p>

                  {/* Price and Rating Row */}
                  <div className="flex items-center justify-between pt-2">
                    {category.price && (
                      <p className="text-lg font-bold text-primary">
                        Starting at ₹{category.price}
                      </p>
                    )}

                    {category.rating && (
                      <div className="flex items-center bg-yellow-50 px-2.5 py-1 rounded-full">
                        <span className="text-xs text-yellow-700 font-semibold">
                          ⭐ {category.rating}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 font-semibold mt-4"
                  >
                    <span>Explore Collection</span>
                    <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 sm:mt-16">
          <div className="inline-flex flex-col items-center">
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
              Can't find what you're looking for?
            </p>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-2 hover:border-primary hover:bg-primary hover:text-white transition-all duration-300 px-6 sm:px-8 text-sm sm:text-base font-semibold"
              >
                Contact Us for Custom Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
