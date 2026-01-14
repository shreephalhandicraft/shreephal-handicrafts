import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List, Package } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SEOHead } from "@/components/SEO/SEOHead";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { getCategorySEO } from "@/config/seoConfig";

const CategoryProducts = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchCategoryAndProducts();
  }, [slug]);

  const fetchCategoryAndProducts = async () => {
    setLoading(true);
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(`*, categories(id, name, slug)`)
      .eq("category_id", categoryData.id)
        .eq("is_active", true);

      if (productError) throw productError;
      setProducts(productData || []);
    } catch (error) {
      console.error("Error fetching category:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      case "name": return a.title.localeCompare(b.title);
      case "newest":
      default: return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const breadcrumbs = category ? [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: category.name, url: `/category/${slug}/products` },
  ] : [];

  const seo = category ? getCategorySEO(category.name, slug) : {};

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen py-8"><div className="container mx-auto px-4"><div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4" /><div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">{[...Array(8)].map((_, i) => (<div key={i} className="bg-white rounded-lg p-4"><div className="aspect-square bg-gray-200 rounded-lg mb-4" /><div className="h-4 bg-gray-200 rounded mb-2" /><div className="h-4 bg-gray-200 rounded w-2/3" /></div>))}</div></div></div></div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="min-h-screen py-12"><div className="container mx-auto px-4 text-center"><h2 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h2><Button onClick={() => window.location.href = "/shop"}>Browse All Products</Button></div></div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* SEO */}
      <SEOHead {...seo} />
      <OpenGraphTags {...seo} type="website" />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <Breadcrumbs items={breadcrumbs} className="mb-4" />
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                {category.description && (
                  <p className="text-gray-600 mt-2">{category.description}</p>
                )}
                <p className="text-gray-500 mt-1">{products.length} products available</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex border rounded-lg">
                  <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name: A to Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12"><Package className="h-16 w-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-500 text-lg">No products in this category yet</p></div>
          ) : (
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProducts;
