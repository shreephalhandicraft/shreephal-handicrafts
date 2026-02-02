import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Award,
  Image,
  Key,
  Calendar,
  Loader2,
  Package,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

// Icon mapping based on category slug
const iconMap = {
  trophies: Award,
  "photo-frames": Image,
  "key-holders": Key,
  calendars: Calendar,
  default: Package, // Default fallback icon
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
        thumbnail: "c_fill,h_200,q_auto,w_200,f_auto",
        medium: "c_fill,h_400,q_auto,w_400,f_auto",
        large: "c_fill,h_600,q_auto,w_600,f_auto",
        square: "c_fill,h_300,q_auto,w_300,f_auto", // Perfect for category cards
        original: "q_auto,f_auto",
      };

      return `${baseUrl}/${
        transformations[transformation] || transformations.square
      }/${publicId}`;
    }
  }

  return imageUrl; // Return original if not Cloudinary
};

// Enhanced category image component with fallback system
const CategoryImage = ({ category, className }) => {
  const [imageState, setImageState] = useState("loading"); // loading, loaded, error
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
    // Try fallback to original URL if Cloudinary fails
    if (currentImageUrl !== category.image && category.image) {
      setCurrentImageUrl(category.image);
    } else {
      setImageState("error");
    }
  };

  // Show icon if no image, loading, or error
  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center group-hover:from-primary/15 group-hover:to-primary/10 transition-all duration-300`}
      >
        <IconComponent className="h-16 w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="text-xs text-primary/70 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* Overlay with icon on hover (for images) */}
      {imageState === "loaded" && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <IconComponent className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300" />
        </div>
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

        console.log("Fetching featured categories...");

        // Test basic connection first
        const { data: testData, error: testError } = await supabase
          .from("categories")
          .select("count", { count: "exact", head: true });

        if (testError) {
          console.error("Connection test failed:", testError);
          throw new Error(`Database connection failed: ${testError.message}`);
        }

        console.log(
          "Database connection successful. Total categories:",
          testData
        );

        // Fetch only featured categories from Supabase
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, price, image, rating, featured")
          .eq("featured", true)
          .order("name", { ascending: true });

        if (error) {
          console.error("Error fetching featured categories:", error);
          throw new Error(`Failed to fetch categories: ${error.message}`);
        }

        console.log("Featured categories fetched:", data);

        // If no featured categories, fetch all categories as fallback
        if (!data || data.length === 0) {
          console.log(
            "No featured categories found, fetching all categories..."
          );

          const { data: allData, error: allError } = await supabase
            .from("categories")
            .select("id, name, slug, price, image, rating, featured")
            .order("name", { ascending: true })
            .limit(4);

          if (allError) {
            console.error("Error fetching all categories:", allError);
            throw new Error(`Failed to fetch categories: ${allError.message}`);
          }

          console.log("All categories fetched:", allData);
          setCategories(allData || []);
        } else {
          setCategories(data);
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
    <section className="py-20 bg-gradient-to-br from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="h-10 bg-gray-200 rounded-lg w-80 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              <div className="p-6">
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

  // Loading state
  if (loading) return <LoadingSkeleton />;

  // Error state
  if (error) {
    return (
      <section className="py-20 bg-gradient-to-br from-red-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm font-medium text-primary">
                Our Categories
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Product Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our wide range of customizable products, each crafted
              with attention to detail and designed to celebrate your unique
              moments.
            </p>
          </div>

          <div className="flex justify-center items-center min-h-64">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-700 font-medium mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm font-medium text-primary">
                Our Categories
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Product Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our wide range of customizable products, each crafted
              with attention to detail and designed to celebrate your unique
              moments.
            </p>
          </div>

          <div className="flex justify-center items-center min-h-64">
            <div className="text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md mx-auto">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-4">
                  No categories available at the moment.
                </p>
                <p className="text-gray-500 text-sm">
                  Please check back later or contact us for more information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Main content with categories
  return (
    <section className="py-20 bg-gradient-to-br from-white via-gray-50/50 to-white">
      <div className="container mx-auto px-4">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">
              Explore Categories
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Our Product Categories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover our wide range of customizable products, each crafted with
            attention to detail and designed to celebrate your unique moments.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => {
            const description =
              defaultDescriptions[category.slug] ||
              "Customizable products for your needs";

            return (
              <div
                key={category.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1"
              >
                {/* Image/Icon Container */}
                <CategoryImage category={category} className="aspect-square" />

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
                      {category.name}
                    </h3>
                    {category.featured && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    {description}
                  </p>

                  {category.price && (
                    <p className="text-lg font-semibold text-primary mb-4">
                      Starting at ₹{category.price}
                    </p>
                  )}

                  {/* Rating if available */}
                  {category.rating && (
                    <div className="flex items-center mb-4">
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                        <span className="text-xs text-yellow-700 font-medium">
                          ⭐ {category.rating}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link to={`/category/${category.slug}/products`}>
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 font-medium"
                    >
                      Explore {category.name}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col items-center">
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for?
            </p>
            <Link to="/contact">
              <Button
                variant="outline"
                className="border-2 hover:border-primary hover:bg-primary hover:text-white transition-all duration-300 px-8"
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
