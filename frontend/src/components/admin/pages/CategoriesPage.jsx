import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
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
  Package, 
  Star, 
  IndianRupee, 
  RefreshCw,
  Search,
  Filter,
  X,
  ArrowUpDown,
  Image as ImageIcon,
} from "lucide-react";
import { AddCategoryForm, EditCategoryForm } from "../forms/CategoryForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Fetch categories with ALL fields and ACTIVE product counts only
  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Use left join (no !inner) to include categories with 0 products
      const { data, error } = await supabase.from("categories").select(`
        id,
        name,
        slug,
        price,
        image,
        rating,
        featured,
        products(id, is_active)
      `);

      if (error) throw error;

      const categoriesWithCount = data.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        price: category.price,
        image: category.image,
        rating: category.rating,
        featured: category.featured,
        products: category.products 
          ? category.products.filter(p => p.is_active).length 
          : 0,
      }));

      setCategories(categoriesWithCount);
    } catch (error) {
      toast({ 
        title: "Failed to fetch categories", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create category handler
  const handleCreate = async (data) => {
    try {
      const { error, data: newCategory } = await supabase
        .from("categories")
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      // Add to local state with 0 products
      setCategories([...categories, { ...newCategory, products: 0 }]);
      setIsFormOpen(false);
      toast({ title: "Category created successfully" });
    } catch (error) {
      toast({ 
        title: "Failed to create category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  // Edit category handler
  const handleEdit = async (data) => {
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", editingCategory.id);

      if (error) throw error;

      // Update local state, preserving products count
      setCategories(
        categories.map((c) =>
          c.id === editingCategory.id 
            ? { ...c, ...data, products: c.products }
            : c
        )
      );
      setEditingCategory(null);
      setIsFormOpen(false);
      toast({ title: "Category updated successfully" });
    } catch (error) {
      toast({ 
        title: "Failed to update category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  // Delete category handler - check for active products first
  const handleDelete = async () => {
    if (!deleteCategory) return;

    try {
      // Check if category has any ACTIVE products
      const { data: activeProducts, error: checkError } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", deleteCategory.id)
        .eq("is_active", true);

      if (checkError) throw checkError;

      if (activeProducts && activeProducts.length > 0) {
        toast({
          title: "Cannot delete category",
          description: `This category has ${activeProducts.length} active product(s). Delete all products first or move them to another category.`,
          variant: "destructive",
        });
        setDeleteCategory(null);
        return;
      }

      // Delete the category (only if no active products)
      const { error: categoryDeleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteCategory.id);

      if (categoryDeleteError) throw categoryDeleteError;

      // Update local state to remove deleted category
      setCategories(categories.filter((c) => c.id !== deleteCategory.id));
      setDeleteCategory(null);
      toast({ title: "Category deleted successfully" });
    } catch (error) {
      toast({
        title: "Deletion error",
        description: error.message || "An error occurred during deletion",
        variant: "destructive",
      });
    }
  };

  // Filter and sort categories
  const filteredCategories = categories
    .filter((category) => {
      // Search filter
      const matchesSearch = searchTerm
        ? category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.slug?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "featured") {
        matchesStatus = category.featured;
      } else if (statusFilter === "with-products") {
        matchesStatus = category.products > 0;
      } else if (statusFilter === "empty") {
        matchesStatus = category.products === 0;
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort logic
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "products") {
        return b.products - a.products;
      } else if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

  // Stats calculations
  const totalCategories = categories.length;
  const featuredCategories = categories.filter(c => c.featured).length;
  const categoriesWithProducts = categories.filter(c => c.products > 0).length;
  const emptyCategories = totalCategories - categoriesWithProducts;

  // Price formatting
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Categories
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Organize your products into categories
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            onClick={fetchCategories} 
            variant="outline" 
            className="gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setIsFormOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Category</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Total Categories
            </CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {totalCategories}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Featured
            </CardTitle>
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {featuredCategories}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              With Products
            </CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {categoriesWithProducts}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Empty
            </CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {emptyCategories}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filter, and Sort */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Search, Filter & Sort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* First row: Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories by name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            {/* Second row: Filters and Sort */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Status Filter */}
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="featured">Featured Only</SelectItem>
                    <SelectItem value="with-products">With Products</SelectItem>
                    <SelectItem value="empty">Empty Categories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex-1">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="products">Sort by Products Count</SelectItem>
                    <SelectItem value="rating">Sort by Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {(searchTerm || statusFilter !== "all" || sortBy !== "name") && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Active filters:
                </span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Search: "
                    {searchTerm.length > 15
                      ? searchTerm.slice(0, 15) + "..."
                      : searchTerm}
                    "
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {sortBy !== "name" && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    Sort: {sortBy}
                    <button
                      onClick={() => setSortBy("name")}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-base sm:text-lg">Categories List</span>
            <Badge variant="outline" className="self-start sm:self-center text-xs">
              {filteredCategories.length} of {totalCategories} categories
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {statusFilter !== "all"
              ? `Showing ${statusFilter} categories`
              : "All categories"}
            {searchTerm && ` matching "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <div className="text-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="text-base sm:text-lg font-medium">
                  Loading categories...
                </div>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-base sm:text-lg font-medium mb-2">
                No categories found
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by adding your first category"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsFormOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Category
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="bg-surface-light border-border hover:shadow-lg transition-all duration-200 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      {/* Category Image */}
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-md border flex-shrink-0 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      <div className="flex gap-1 flex-shrink-0">
                        {category.featured && (
                          <Badge 
                            variant="secondary" 
                            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs"
                          >
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardTitle className="text-base sm:text-lg truncate">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="text-xs truncate">
                      Slug: {category.slug}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {/* Price */}
                      {category.price && (
                        <div className="flex items-center gap-1 text-sm sm:text-base">
                          <span className="font-semibold text-foreground">
                            {formatPrice(category.price)}
                          </span>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 sm:h-4 sm:w-4 ${
                              i < (category.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                        <span className="text-xs sm:text-sm text-muted-foreground ml-1">
                          ({category.rating || 0})
                        </span>
                      </div>

                      {/* Product Count */}
                      <div className="pt-2 border-t">
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl sm:text-2xl font-bold text-foreground">
                            {category.products}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Active Products
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category);
                            setIsFormOpen(true);
                          }}
                          className="flex-1 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950/20 text-xs sm:text-sm"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/20 text-xs sm:text-sm"
                          onClick={() => setDeleteCategory(category)}
                          disabled={category.products > 0}
                          title={category.products > 0 ? "Cannot delete category with active products" : "Delete category"}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit form */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingCategory(null);
          }
        }}
      >
        <DialogContent className="max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingCategory ? (
            <EditCategoryForm
              category={editingCategory}
              onSubmit={handleEdit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingCategory(null);
              }}
            />
          ) : (
            <AddCategoryForm
              onSubmit={handleCreate}
              onCancel={() => setIsFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation alert */}
      <AlertDialog
        open={!!deleteCategory}
        onOpenChange={() => setDeleteCategory(null)}
      >
        <AlertDialogContent className="max-w-xs sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {deleteCategory?.products > 0 ? (
                <span className="text-destructive font-medium">
                  Cannot delete "{deleteCategory?.name}" because it has {deleteCategory?.products} active product(s). 
                  Please delete or move all products first.
                </span>
              ) : (
                <span>
                  Are you sure you want to delete "{deleteCategory?.name}"? 
                  This action cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            {deleteCategory?.products === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
              >
                Delete Category
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}