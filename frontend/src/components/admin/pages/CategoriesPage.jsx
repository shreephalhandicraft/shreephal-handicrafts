import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, Edit, Trash2, Package, AlertCircle, RefreshCw } from "lucide-react";
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch categories and product counts
  const fetchCategories = async (showRefreshToast = false) => {
    setRefreshing(true);
    const { data, error } = await supabase.from("categories").select(`
      id,
      name,
      slug,
      image,
      price,
      rating,
      featured,
      products:products(id)
    `);

    if (error) {
      toast({ title: "Failed to fetch categories", variant: "destructive" });
      setRefreshing(false);
      setLoading(false);
      return;
    }

    const categoriesWithCount = data.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      price: category.price,
      rating: category.rating,
      featured: category.featured,
      products: category.products ? category.products.length : 0,
    }));

    setCategories(categoriesWithCount);
    setLastUpdated(new Date());
    setRefreshing(false);
    setLoading(false);
    
    if (showRefreshToast) {
      toast({ title: "✅ Categories refreshed" });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    fetchCategories(true);
  };

  // Create category handler
  const handleCreate = async (data) => {
    // Check for duplicate slug
    const duplicateSlug = categories.find(
      (cat) => cat.slug.toLowerCase() === data.slug.toLowerCase()
    );

    if (duplicateSlug) {
      toast({
        title: "Duplicate Slug",
        description: "A category with this slug already exists",
        variant: "destructive",
      });
      return;
    }

    const { error, data: newCategory } = await supabase
      .from("categories")
      .insert([data])
      .select()
      .single();

    if (error) {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setIsFormOpen(false);
    toast({ title: "Category created successfully" });
    // ✅ Refetch to get accurate counts
    fetchCategories();
  };

  // Edit category handler
  const handleEdit = async (data) => {
    if (!editingCategory) return;

    // Check for duplicate slug (excluding current category)
    const duplicateSlug = categories.find(
      (cat) =>
        cat.slug.toLowerCase() === data.slug.toLowerCase() &&
        cat.id !== editingCategory.id
    );

    if (duplicateSlug) {
      toast({
        title: "Duplicate Slug",
        description: "A category with this slug already exists",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("categories")
      .update(data)
      .eq("id", editingCategory.id);

    if (error) {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setEditingCategory(null);
    setIsFormOpen(false);
    toast({ title: "Category updated successfully" });
    // ✅ Refetch to get accurate counts
    fetchCategories();
  };

  // Delete category handler
  const handleDelete = async () => {
    if (!deleteCategory) return;

    // ✅ Check if category has products
    if (deleteCategory.products > 0) {
      toast({
        title: "Cannot Delete Category",
        description: `This category has ${deleteCategory.products} product(s). Please reassign or delete them first.`,
        variant: "destructive",
      });
      setDeleteCategory(null);
      return;
    }

    try {
      // Only delete category if it has NO products
      const { error: categoryDeleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteCategory.id);

      if (categoryDeleteError) {
        toast({
          title: "Failed to delete category",
          description: categoryDeleteError.message,
          variant: "destructive",
        });
        return;
      }

      setDeleteCategory(null);
      toast({ title: "Category deleted successfully" });
      // ✅ Refetch to get accurate counts
      fetchCategories();
    } catch (error) {
      toast({
        title: "Deletion error",
        description: error.message || "An error occurred during deletion",
        variant: "destructive",
      });
    }
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    const now = new Date();
    const seconds = Math.floor((now - lastUpdated) / 1000);
    
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

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
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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

      {/* Last Updated Info */}
      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Last updated: {formatLastUpdated()}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Category Management:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Categories with products cannot be deleted</li>
            <li>Delete all products first, then click refresh to update count</li>
            <li>Empty categories can be deleted safely</li>
          </ul>
        </div>
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
            <p className="text-center py-10">Loading categories...</p>
          ) : categories.length === 0 ? (
            <div className="text-center py-10">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">No categories yet</p>
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setIsFormOpen(true);
                }}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Category
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="bg-surface-light border-border relative"
                >
                  {/* Product Count Badge */}
                  <div className="absolute top-3 right-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      category.products === 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {category.products} {category.products === 1 ? 'product' : 'products'}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-16 w-16 rounded object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <CardTitle className="text-lg mt-2">{category.name}</CardTitle>
                    <CardDescription>
                      Slug: {category.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {category.products}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Products
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingCategory(category);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            // Show warning if category has products
                            if (category.products > 0) {
                              toast({
                                title: "Cannot Delete",
                                description: `This category has ${category.products} product(s). Delete them first, then click refresh.`,
                                variant: "destructive",
                              });
                              return;
                            }
                            setDeleteCategory(category);
                          }}
                          disabled={category.products > 0}
                        >
                          <Trash2 className="h-4 w-4" />
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
        <DialogContent>
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
              Are you sure you want to delete "{deleteCategory?.name}"?
              {deleteCategory?.products > 0 ? (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ This category has {deleteCategory.products} product(s) and cannot be deleted.
                </span>
              ) : (
                <span className="block mt-2">
                  This action cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCategory?.products > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
