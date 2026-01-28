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
import { Plus, Edit, Trash2, Package, Star, IndianRupee, RefreshCw } from "lucide-react";
import { AddCategoryForm, EditCategoryForm } from "../forms/CategoryForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Fetch categories with ALL fields and product counts (no is_active filter - using hard delete)
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
        products(id)
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
        products: category.products ? category.products.length : 0,
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

  // Delete category handler - check for products first
  const handleDelete = async () => {
    if (!deleteCategory) return;

    try {
      // Check if category has any products (hard delete, no is_active filter)
      const { data: products, error: checkError } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", deleteCategory.id);

      if (checkError) throw checkError;

      if (products && products.length > 0) {
        toast({
          title: "Cannot delete category",
          description: `This category has ${products.length} product(s). Delete all products first or move them to another category.`,
          variant: "destructive",
        });
        setDeleteCategory(null);
        return;
      }

      // Delete the category (only if no products)
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

  // Stats calculations
  const totalCategories = categories.length;
  const featuredCategories = categories.filter(c => c.featured).length;
  const categoriesWithProducts = categories.filter(c => c.products > 0).length;
  const emptyCategories = totalCategories - categoriesWithProducts;

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products into categories
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchCategories} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setIsFormOpen(true);
            }}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredCategories}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Products</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoriesWithProducts}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empty</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emptyCategories}</div>
          </CardContent>
        </Card>
      </div>

      {/* Categories list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Categories List</CardTitle>
          <CardDescription>
            You have {categories.length} categories configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="text-lg font-medium">Loading categories...</div>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first category
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Category
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="bg-surface-light border-border hover:shadow-lg transition-all duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex gap-1">
                        {category.featured && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Slug: {category.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Price */}
                      {category.price && (
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {Number(category.price).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < (category.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({category.rating || 0})
                        </span>
                      </div>

                      {/* Product Count */}
                      <div className="pt-2 border-t">
                        <p className="text-2xl font-bold text-foreground">
                          {category.products}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Products
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-red-50"
                          onClick={() => setDeleteCategory(category)}
                          disabled={category.products > 0}
                          title={category.products > 0 ? "Cannot delete category with products" : "Delete category"}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategory?.products > 0 ? (
                <span className="text-destructive font-medium">
                  Cannot delete "{deleteCategory?.name}" because it has {deleteCategory?.products} product(s). 
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
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteCategory?.products === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
