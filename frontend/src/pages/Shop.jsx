import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  ChevronRight,
  Package,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SEOHead } from "@/components/SEO/SEOHead";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { PAGE_SEO } from "@/config/seoConfig";

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

  // Filter categories by search query
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (slug) => {
    navigate(`/category/${slug}/products`);
  };

  return (
    <Layout>
      {/* SEO */}
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
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Shop by Category
              </h1>
              <p className="text-gray-600 text-lg">
                Browse our collection of {categories.length} categories
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-gray-600 text-lg">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  onClick={() => handleCategoryClick(category.slug)}
                >
                  {/* Category Image */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-20 w-20 text-purple-300" />
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                  </div>

                  {/* Category Info */}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        {category.price && (
                          <p className="text-sm text-gray-600">
                            Starting at ₹{category.price}
                          </p>
                        )}
                        {category.rating && (
                          <div className="flex items-center mt-2">
                            <span className="text-yellow-500 text-sm mr-1">
                              ★
                            </span>
                            <span className="text-sm text-gray-600">
                              {category.rating}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>

                    {category.featured && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⭐ Featured
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results Count */}
          {!loading && filteredCategories.length > 0 && (
            <div className="text-center mt-12">
              <p className="text-gray-600">
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
