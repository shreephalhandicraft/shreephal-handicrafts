import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingBag,
  Loader2,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SEOHead } from "@/components/SEO/SEOHead";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { PAGE_SEO } from "@/config/seoConfig";

// Category Image Component with fallback
const CategoryImage = ({ category, className }) => {
  const [imageState, setImageState] = useState("loading");

  useEffect(() => {
    if (category.image) {
      setImageState("loading");
    } else {
      setImageState("no-image");
    }
  }, [category.image]);

  const handleImageLoad = () => {
    setImageState("loaded");
  };

  const handleImageError = () => {
    setImageState("error");
  };

  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center group-hover:from-primary/15 group-hover:to-primary/10 transition-all duration-300`}
      >
        <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="text-xs text-primary/70 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-2">
          {category.name?.slice(0, 20)}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
        </div>
      )}

      {category.image && (
        <img
          src={category.image}
          alt={category.name}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {imageState === "loaded" && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
      )}
    </div>
  );
};

const Shop = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (slug) => {
    navigate(`/category/${slug}/products`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Layout>
      <SEOHead
        title={PAGE_SEO.shop.title}
        description={PAGE_SEO.shop.description}
        keywords={PAGE_SEO.shop.keywords}
        path={PAGE_SEO.shop.path}
      />
      <OpenGraphTags
        title={PAGE_SEO.shop.title}
        description={PAGE_SEO.shop.description}
        url={PAGE_SEO.shop.path}
        type="website"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
        ]}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Shop by Category
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Browse our collection of {categories.length} categories
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 h-10 sm:h-12 text-base sm:text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="container mx-auto px-4 py-8 sm:py-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-gray-600 text-lg">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No categories found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? `No categories match "${searchQuery}"`
                  : "No categories available at the moment"}
              </p>
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery("")}
                  className="mt-6"
                  variant="outline"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.slug)}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group relative border border-gray-100 hover:-translate-y-1 cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <CategoryImage
                      category={category}
                      className="w-full h-full"
                    />

                    {/* Featured Badge */}
                    {category.featured && (
                      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
                        <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold shadow-lg">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    {/* Title */}
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
                      {category.name}
                    </h3>

                    {/* Price & Rating */}
                    <div className="flex items-center justify-between gap-2">
                      {category.price && (
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs text-gray-500 mb-1">Starting at</span>
                          <span className="text-base sm:text-lg lg:text-xl font-bold text-primary truncate">
                            {formatPrice(category.price)}
                          </span>
                        </div>
                      )}

                      {category.rating && (
                        <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shrink-0">
                          <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-yellow-700 ml-1 font-medium">
                            {category.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Browse Button */}
                    <Button
                      size="sm"
                      className="w-full mt-3 sm:mt-4 text-xs sm:text-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryClick(category.slug);
                      }}
                    >
                      Browse Products
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Count */}
          {!loading && filteredCategories.length > 0 && (
            <div className="text-center mt-8 sm:mt-12">
              <p className="text-gray-600 text-sm sm:text-base">
                Showing {filteredCategories.length} of {categories.length}{" "}
                {categories.length === 1 ? "category" : "categories"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Shop;
