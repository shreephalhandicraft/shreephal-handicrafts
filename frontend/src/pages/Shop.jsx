import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Star,
  Loader2,
  Grid3X3,
  List,
  ShoppingBag,
  Tag,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// Helper function for Cloudinary image optimization
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
        large: "c_fill,h_600,q_auto,w_600,f_auto",
        original: "q_auto,f_auto",
      };

      return `${baseUrl}/${
        transformations[transformation] || transformations.medium
      }/${publicId}`;
    }
  }

  return imageUrl;
};

// Category Image Component
const CategoryImage = ({ category, className }) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  useEffect(() => {
    if (category.image) {
      const optimizedUrl = getCloudinaryImageUrl(category.image, "medium");
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
      setImageState("loading");
    } else {
      setImageState("error");
    }
  };

  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center group-hover:from-primary/15 group-hover:to-primary/10 transition-all duration-300`}
      >
        <ShoppingBag className="h-16 w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="text-xs text-primary/70 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-2">
          {category.name?.slice(0, 15) || "Category"}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}

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
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category, viewMode = "grid" }) => {
  const formatPrice = (price) => {
    if (!price) return "Price varies";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice)
      ? "Price varies"
      : `Starting from ₹${numPrice.toLocaleString("en-IN")}`;
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary/20">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="w-full sm:w-48 h-48 flex-shrink-0 relative group">
            <CategoryImage category={category} className="w-full h-full" />
          </div>

          {/* Content - Fixed padding and structure */}
          <div className="flex-1 p-4 sm:p-6 min-w-0">
            {" "}
            {/* Added min-w-0 to prevent overflow */}
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {category.featured && (
                    <Badge
                      variant="outline"
                      className="text-yellow-600 border-yellow-300 bg-yellow-50"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {category.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">
                        {Number(category.rating).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {category.name}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  Explore our collection of {category.name.toLowerCase()}
                </p>
              </div>

              {/* Price and Button Section - Fixed layout */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-auto">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {formatPrice(category.price)}
                </div>
                <div className="flex-shrink-0">
                  {" "}
                  {/* Prevent button from shrinking */}
                  <Link to={`/category/${category.slug}/products`}>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto shadow-lg whitespace-nowrap"
                    >
                      Browse Category
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view - Fixed padding and button positioning
  return (
    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group relative border border-gray-100 hover:border-primary/20 w-full max-w-full">
      {" "}
      {/* Added width constraints */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <CategoryImage category={category} className="w-full h-full" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

        {category.featured && (
          <div className="absolute top-4 left-4">
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-700 border-yellow-200 backdrop-blur-sm font-medium"
            >
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        {/* Fixed hover button positioning */}
        <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Link to={`/category/${category.slug}/products`} className="block">
            <Button
              size="sm"
              className="w-full bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white shadow-lg border-0 truncate"
            >
              <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Browse Category</span>
            </Button>
          </Link>
        </div>
      </div>
      {/* Fixed card content padding and button structure */}
      <div className="p-4 sm:p-6 space-y-4 w-full">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="text-primary border-primary/30 bg-primary/5 font-medium"
          >
            <Tag className="h-3 w-3 mr-1" />
            Category
          </Badge>
          {category.rating && (
            <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {Number(category.rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {category.name}
          </h3>

          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
            Discover our amazing collection of {category.name.toLowerCase()}{" "}
            with various designs and customization options.
          </p>
        </div>

        {/* Fixed bottom section with proper spacing */}
        <div className="pt-4 border-t border-gray-100 w-full">
          <div className="flex flex-col space-y-3">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatPrice(category.price)}
            </div>

            <Link to={`/category/${category.slug}/products`} className="w-full">
              <Button
                size="lg"
                className="w-full px-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Browse Category
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Shop = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  // Fetch only categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories with all the fields from your schema
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select(
            `
            id,
            name,
            slug,
            image,
            price,
            rating,
            featured
          `
          )
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;

        setCategories(categoriesData || []);
        setFilteredCategories(categoriesData || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
        setCategories([]);
        setFilteredCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Enhanced search and filter functionality
  useEffect(() => {
    let filtered = [...categories];

    // Enhanced search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((category) => {
        // Search in multiple fields
        const searchableText = [
          category.name || "",
          category.slug || "",
          `starting from ${category.price || 0}`,
          category.featured ? "featured" : "",
          category.rating ? `rated ${category.rating}` : "",
        ]
          .join(" ")
          .toLowerCase();

        // Also search for partial matches and multiple words
        const searchWords = query.split(" ").filter((word) => word.length > 0);

        return searchWords.every(
          (word) =>
            searchableText.includes(word) ||
            category.name?.toLowerCase().includes(word)
        );
      });
    }

    // Sort categories
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case "price-high":
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "rating-high":
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        case "featured":
          // Featured first, then sort by name
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (a.name || "").localeCompare(b.name || "");
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });

    setFilteredCategories(filtered);
  }, [categories, searchQuery, sortBy]);

  // Clear search function
  const clearSearch = () => {
    setSearchQuery("");
  };

  if (loading) {
    return (
      <Layout>
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white min-h-screen">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="space-y-2">
                <p className="text-gray-700 text-xl font-medium">
                  Loading our categories...
                </p>
                <p className="text-gray-500 text-sm">
                  Fetching the best categories for you
                </p>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white min-h-screen">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
              <div className="text-red-100 bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-yellow-50 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Categories
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Explore our diverse collection of categories. From trophies to
              frames and gifts, find the perfect category for your needs.
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search categories, price range, featured..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-lg transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-500 mt-2">
                  Searching for:{" "}
                  <span className="font-medium">"{searchQuery}"</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Categories Content */}
      <div className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Controls Row */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-sm text-gray-600">
                  {filteredCategories.length} of {categories.length} categories
                  found
                </span>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating-high">Highest Rated</option>
                  <option value="featured">Featured First</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Categories Grid/List */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
                <div className="text-primary bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Categories Found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery.trim()
                    ? `No categories match "${searchQuery}". Try different keywords.`
                    : "No categories are available at the moment."}
                </p>
                {searchQuery.trim() ? (
                  <Button onClick={clearSearch} className="w-full">
                    Clear Search
                  </Button>
                ) : (
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Refresh Page
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }
            >
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Shop;
