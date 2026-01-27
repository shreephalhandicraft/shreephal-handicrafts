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
  LayoutGrid,
  List,
  Star,
  IndianRupee,
  CheckCircle,
  XCircle,
  RefreshCw,
  Archive,
  AlertTriangle,
  Truck,
  Clock,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [variantsMap, setVariantsMap] = useState({}); // Variants keyed by product_id
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ NEW: Helper to check order statuses for variants
  const getOrderStatusForVariants = async (variants) => {
    const variantIds = variants.map(v => v.id).filter(Boolean);
    
    if (variantIds.length === 0) {
      return { pendingOrders: 0, deliveredOrders: 0, totalOrders: 0 };
    }

    try {
      // Get all order_items for these variants with order status
      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select(`
          id,
          variant_id,
          order_id,
          orders!inner (
            id,
            status
          )
        `)
        .in("variant_id", variantIds);
      
      if (error) throw error;
      
      let pendingOrders = 0;
      let deliveredOrders = 0;
      
      for (const item of orderItems || []) {
        const orderStatus = item.orders?.status?.toLowerCase();
        
        // ✅ Delivered orders can be deleted
        if (orderStatus === 'delivered') {
          deliveredOrders++;
        } else {
          // ✅ Pending/Processing/Shipped orders need to be preserved
          pendingOrders++;
        }
      }
      
      return {
        pendingOrders,
        deliveredOrders,
        totalOrders: pendingOrders + deliveredOrders
      };
    } catch (error) {
      console.error("Error checking order status:", error);
      return { pendingOrders: 0, deliveredOrders: 0, totalOrders: 0 };
    }
  };

  // Fetch products including is_active status
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

      // Fetch products with is_active status
      const { data: prods, error: prodErr } = await supabase
        .from("products")
        .select("*, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (prodErr) throw prodErr;

      setProducts(prods || []);

      // Fetch variants with is_active status and order count
      const productIds = prods?.map((p) => p.id) || [];
      if (productIds.length > 0) {
        const { data: vars, error: varErr } = await supabase
          .from("product_variants")
          .select("id, product_id, sku, size_display, size_numeric, size_unit, price_tier, price, stock_quantity, is_active")
          .in("product_id", productIds);
        if (varErr) throw varErr;

        // Map variants by product_id with order count
        const map = {};
        for (const v of vars) {
          // Check order count for each variant
          const { count } = await supabase
            .from("order_items")
            .select("*", { count: "exact", head: true })
            .eq("variant_id", v.id);
          
          const variantWithCount = { ...v, order_count: count || 0 };
          
          if (!map[v.product_id]) map[v.product_id] = [];
          map[v.product_id].push(variantWithCount);
        }
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

  // ✅ IMPROVED: Smart delete based on order status
  const handleDelete = async () => {
    if (!deleteProduct) return;
    setLoading(true);

    try {
      const variants = variantsMap[deleteProduct.id] || [];
      
      // ✅ Check order statuses
      const { pendingOrders, deliveredOrders, totalOrders } = await getOrderStatusForVariants(variants);

      if (pendingOrders > 0) {
        // ✅ SOFT DELETE: Has pending/active orders
        
        // Deactivate all variants
        for (const variant of variants) {
          const { error } = await supabase
            .from("product_variants")
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq("id", variant.id);
          
          if (error) throw error;
        }

        // Deactivate product
        const { error: prodError } = await supabase
          .from("products")
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq("id", deleteProduct.id);

        if (prodError) throw prodError;

        toast({ 
          title: "Product deactivated", 
          description: `"${deleteProduct.title}" has ${pendingOrders} active order(s). Deactivated to preserve order data.`,
        });
      } else {
        // ✅ HARD DELETE: No pending orders (either no orders or all delivered)
        
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

        const message = deliveredOrders > 0 
          ? `"${deleteProduct.title}" had ${deliveredOrders} delivered order(s) and has been permanently deleted.`
          : `"${deleteProduct.title}" and all its variants have been permanently deleted.`;
        
        toast({ 
          title: "Product deleted", 
          description: message
        });
      }

      // Refresh data
      await fetchData();
      setDeleteProduct(null);
      setDeleteWarning(null);
    } catch (error) {
      console.error("Delete product error:", error);
      
      // Fallback: If foreign key error, try soft delete
      if (error.message.includes("foreign key constraint") || error.message.includes("violates")) {
        try {
          const variants = variantsMap[deleteProduct.id] || [];
          for (const variant of variants) {
            await supabase
              .from("product_variants")
              .update({ 
                is_active: false,
                updated_at: new Date().toISOString()
              })
              .eq("id", variant.id);
          }

          await supabase
            .from("products")
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq("id", deleteProduct.id);

          toast({
            title: "Product deactivated",
            description: `"${deleteProduct.title}" has order history and was deactivated.`,
          });

          await fetchData();
          setDeleteProduct(null);
          setDeleteWarning(null);
        } catch (fallbackError) {
          toast({
            title: "Failed to deactivate product",
            description: fallbackError.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Failed to delete product",
          description: error.message,
          variant: "destructive",
        });
      }
    }
    setLoading(false);
  };

  // ✅ IMPROVED: Check order status before showing delete dialog
  const handleDeleteClick = async (product) => {
    const variants = variantsMap[product.id] || [];
    
    // ✅ Check order statuses
    const { pendingOrders, deliveredOrders, totalOrders } = await getOrderStatusForVariants(variants);
    
    if (pendingOrders > 0) {
      // Has active orders - will be soft deleted
      setDeleteWarning({
        hasActiveOrders: true,
        pendingOrders,
        deliveredOrders,
        totalOrders,
        message: `This product has ${pendingOrders} active order(s) ${deliveredOrders > 0 ? `and ${deliveredOrders} delivered order(s)` : ''}. It will be deactivated to preserve order data.`
      });
    } else if (deliveredOrders > 0) {
      // Only delivered orders - can be hard deleted
      setDeleteWarning({
        hasActiveOrders: false,
        pendingOrders: 0,
        deliveredOrders,
        totalOrders,
        message: `This product has ${deliveredOrders} delivered order(s). Since all orders are complete, it can be permanently deleted.`
      });
    } else {
      // No orders - can be hard deleted
      setDeleteWarning({
        hasActiveOrders: false,
        pendingOrders: 0,
        deliveredOrders: 0,
        totalOrders: 0,
        message: "This product has no orders and will be permanently deleted."
      });
    }
    
    setDeleteProduct(product);
  };

  // Refresh page
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
                  <LayoutGrid className="h-4 w-4" />
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
              {filteredProducts.map((product) => {
                const variants = variantsMap[product.id] || [];
                const hasOrders = variants.some(v => (v.order_count || 0) > 0);
                
                return (
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
                            <div className="flex gap-1 flex-wrap">
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
                              {hasOrders && (
                                <Badge variant="outline" className="border-blue-500 text-blue-700">
                                  Has Orders
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {product.description}
                          </p>

                          {variants.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold mb-1 text-sm">
                                Available Sizes:
                              </h4>
                              <ul className="flex flex-wrap gap-2 text-sm">
                                {variants.filter(v => v.is_active).map((variant) => (
                                  <li
                                    key={variant.id}
                                    className="bg-gray-100 px-3 py-1 rounded-full border border-gray-300 text-xs"
                                  >
                                    <span className="font-medium">
                                      {variant.size_display}
                                    </span>
                                    {variant.price && (
                                      <span className="ml-1 text-gray-600">
                                        — ₹{Number(variant.price).toFixed(2)}
                                      </span>
                                    )}
                                    {variant.sku && (
                                      <span className="ml-1 text-gray-500 text-xs">
                                        ({variant.sku})
                                      </span>
                                    )}
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
                                {product.price ? Number(product.price).toFixed(2) : '0.00'}
                              </span>
                              <span className="text-xs text-gray-500">(base)</span>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(`/admin/products/edit/${product.id}`)
                                }
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-red-50 hover:border-red-300"
                                onClick={() => handleDeleteClick(product)}
                              >
                                {hasOrders ? (
                                  <>
                                    <Archive className="h-4 w-4 mr-1" />
                                    Delete
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ IMPROVED: Delete Confirmation Dialog with Order Status */}
      <AlertDialog
        open={!!deleteProduct}
        onOpenChange={() => {
          setDeleteProduct(null);
          setDeleteWarning(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteWarning?.hasActiveOrders ? (
                <span className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-orange-500" />
                  Deactivate Product
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Delete Product
                </span>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to {deleteWarning?.hasActiveOrders ? 'deactivate' : 'delete'} 
                <span className="font-semibold"> "{deleteProduct?.title}"</span>?
              </p>
              
              {/* ✅ Order Status Breakdown */}
              {deleteWarning?.totalOrders > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-900 space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Order Status:
                    </p>
                    {deleteWarning.pendingOrders > 0 && (
                      <p className="flex items-center gap-2 ml-6">
                        <Clock className="h-3 w-3 text-orange-600" />
                        <span className="text-orange-700 font-semibold">
                          {deleteWarning.pendingOrders} active order(s)
                        </span>
                        <span className="text-xs">(pending/processing/shipped)</span>
                      </p>
                    )}
                    {deleteWarning.deliveredOrders > 0 && (
                      <p className="flex items-center gap-2 ml-6">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-green-700 font-semibold">
                          {deleteWarning.deliveredOrders} delivered order(s)
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* ✅ Action Warning */}
              {deleteWarning?.hasActiveOrders ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">⚠️ Active orders detected</p>
                    <p>{deleteWarning.message}</p>
                    <p className="mt-2">The product will be hidden from your store but order history will be preserved.</p>
                  </div>
                </div>
              ) : deleteWarning?.deliveredOrders > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">✅ All orders delivered</p>
                    <p>{deleteWarning.message}</p>
                    <p className="mt-2 font-semibold">This action cannot be undone!</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">⚠️ Permanent deletion</p>
                    <p>This product has no orders and will be permanently deleted along with all its variants.</p>
                    <p className="mt-2 font-semibold">This action cannot be undone!</p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={deleteWarning?.hasActiveOrders 
                ? "bg-orange-600 hover:bg-orange-700" 
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {deleteWarning?.hasActiveOrders ? (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Deactivate Product
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
