import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ImageOff,
  Package,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ProductCard } from "@/components/ProductCard";

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

export const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        {/* Products Grid - Using ProductCard component */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} viewMode="grid" />
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
