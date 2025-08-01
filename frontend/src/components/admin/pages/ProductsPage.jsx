import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Filter,
  Grid3X3,
  List,
  Star,
  IndianRupee,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

import { EditProductForm } from "../forms/ProductForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [variantsMap, setVariantsMap] = useState({}); // Variants keyed by product_id
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch products, categories and variants - extracted into a reusable function
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: cats, error: catErr } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (catErr) throw catErr;
      setCategories(cats || []);

      // Fetch products ONLY (no variants!)
      const { data: prods, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (prodErr) throw prodErr;

      setProducts(prods || []);

      // Fetch variants only for fetched product ids
      const productIds = prods?.map((p) => p.id) || [];
      if (productIds.length > 0) {
        const { data: vars, error: varErr } = await supabase
          .from("product_variants")
          .select("id, product_id, size_code, price, stock_quantity")
          .in("product_id", productIds);
        if (varErr) throw varErr;

        // Map variants by product_id
        const map = {};
        vars.forEach((v) => {
          if (!map[v.product_id]) map[v.product_id] = [];
          map[v.product_id].push(v);
        });
        setVariantsMap(map);
      } else {
        setVariantsMap({});
      }
    } catch (error) {
      toast({
        title: "Failed to fetch data",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [toast]);

  // Initial fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper to count featured excluding an optional product id
  const getFeaturedCountExcluding = (excludeProductId = null) =>
    products.filter((p) => p.featured && p.id !== excludeProductId).length;

  // Handler to update product information after edit (called from EditProductForm)
  const handleEdit = async (data) => {
    if (!editingProduct) return;
    // Check featured limit
    const featuredCount = getFeaturedCountExcluding(editingProduct.id);
    if (data.featured && !editingProduct.featured && featuredCount >= 4) {
      toast({
        title: "Featured Products Limit Reached",
        description: "Only 4 products can be featured at a time.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("products")
      .update(data)
      .eq("id", editingProduct.id);

    if (error) {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Re-fetch data to keep UI in sync (product + variants)
    await fetchData();

    setEditingProduct(null);
    setIsFormOpen(false);
    toast({ title: "Product updated successfully" });
  };

  // Handler to delete product (and its variants)
  const handleDelete = async () => {
    if (!deleteProduct) return;
    setLoading(true);

    try {
      // Delete variants first
      const { error: variantDelError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", deleteProduct.id);

      if (variantDelError) throw variantDelError;

      // Delete product
      const { error: prodDelError } = await supabase
        .from("products")
        .delete()
        .eq("id", deleteProduct.id);

      if (prodDelError) throw prodDelError;

      // Refresh data (products + variants)
      await fetchData();

      setDeleteProduct(null);
      toast({ title: "Product and its variants deleted successfully" });
    } catch (error) {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Refresh page (optional, reload data)
  const handleRefresh = () => {
    fetchData();
  };

  // Filter products by category and search term
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategoryId && selectedCategoryId !== "all"
        ? product.category_id === selectedCategoryId
        : true;
    const matchesSearch = searchTerm
      ? product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  // Stats for display
  const totalProducts = products.length;
  const featuredProducts = products.filter((p) => p.featured).length;
  const inStockProducts = products.filter((p) => p.in_stock).length;
  const outOfStockProducts = totalProducts - inStockProducts;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-lg font-medium">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Products
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your product inventory and catalog
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => navigate("/admin/products/add-product")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredProducts}</div>
            <p className="text-xs text-muted-foreground">
              {4 - featuredProducts} slots available
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inStockProducts}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* Search */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2 min-w-[200px]">
              <label className="text-sm font-medium">Filter by Category</label>

              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">View</label>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategoryId && selectedCategoryId !== "all") ||
          searchTerm ? (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {selectedCategoryId && selectedCategoryId !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find((c) => c.id === selectedCategoryId)?.name}
                  <button
                    onClick={() => setSelectedCategoryId("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Products list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Product Inventory</span>
            <Badge variant="outline">
              {filteredProducts.length} of {totalProducts} products
            </Badge>
          </CardTitle>
          <CardDescription>
            {selectedCategoryId && selectedCategoryId !== "all"
              ? `Showing products in ${
                  categories.find((c) => c.id === selectedCategoryId)?.name ||
                  ""
                }`
              : "Showing all products"}
            {searchTerm && ` matching "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategoryId
                  ? "Try adjusting your filters or search terms"
                  : "Get started by adding your first product"}
              </p>
              {!searchTerm &&
                (!selectedCategoryId || selectedCategoryId === "all") && (
                  <Button
                    onClick={() => navigate("/admin/products/add-product")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                )}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${
                    viewMode === "list" ? "flex flex-row" : ""
                  }`}
                >
                  <div className={viewMode === "list" ? "flex-1 flex" : ""}>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={`Image of ${product.title}`}
                        className={`rounded-md shadow-sm border object-cover ${
                          viewMode === "list"
                            ? "w-40 h-28 mr-4 flex-shrink-0"
                            : "w-full h-48 mb-4"
                        }`}
                      />
                    )}

                    <div className="flex flex-col flex-1">
                      <CardHeader
                        className={`${viewMode === "list" ? "pb-2" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {product.title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {categories.find(
                                (cat) => cat.id === product.category_id
                              )?.name || "Uncategorized"}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            {product.featured && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800 gap-1"
                              >
                                <Star className="h-3 w-3" />
                                Featured
                              </Badge>
                            )}
                            <Badge
                              variant={
                                product.in_stock ? "default" : "destructive"
                              }
                            >
                              {product.in_stock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Display product variants (sizes) inside card */}
                        {variantsMap[product.id] &&
                          variantsMap[product.id].length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold mb-1">
                                Available Sizes:
                              </h4>
                              <ul className="flex flex-wrap gap-3 text-sm">
                                {variantsMap[product.id].map((variant) => (
                                  <li
                                    key={variant.id}
                                    className="bg-gray-100 px-3 py-1 rounded-full border border-gray-300"
                                  >
                                    {variant.size_code} — ₹
                                    {variant.price.toFixed(2)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        <div
                          className={`flex ${
                            viewMode === "list" ? "flex-row" : "flex-col"
                          } justify-between items-${
                            viewMode === "list" ? "center" : "start"
                          } gap-4`}
                        >
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xl font-bold">
                              {product.price.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setIsFormOpen(true);
                              }}
                              className="hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-red-50 hover:border-red-300"
                              onClick={() => setDeleteProduct(product)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto p-6 max-w-2xl">
          {editingProduct && (
            <EditProductForm
              product={editingProduct}
              categories={categories}
              onSubmit={handleEdit} // passes updated product to handleEdit (includes refetch)
              onCancel={() => {
                setIsFormOpen(false);
                setEditingProduct(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.title}"? This
              action cannot be undone and will remove the product and all
              related variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
