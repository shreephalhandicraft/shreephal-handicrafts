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
import { Plus, Edit, Trash2, Package } from "lucide-react";
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

  // Fetch categories and product counts
  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      const { data, error } = await supabase.from("categories").select(`
        id,
        name,
        slug,
        products:products(id)
      `);

      if (error) {
        toast({ title: "Failed to fetch categories", variant: "destructive" });
        setLoading(false);
        return;
      }

      const categoriesWithCount = data.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        products: category.products ? category.products.length : 0,
      }));

      setCategories(categoriesWithCount);
      setLoading(false);
    }
    fetchCategories();
  }, [toast]);

  // Create category handler
  const handleCreate = async (data) => {
    const { error, data: newCategory } = await supabase
      .from("categories")
      .insert([data])
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create category", variant: "destructive" });
      return;
    }

    setCategories([...categories, { ...newCategory, products: 0 }]);
    setIsFormOpen(false);
    toast({ title: "Category created successfully" });
  };

  // Edit category handler
  const handleEdit = async (data) => {
    if (!editingCategory) return;

    const { error } = await supabase
      .from("categories")
      .update(data)
      .eq("id", editingCategory.id);

    if (error) {
      toast({ title: "Failed to update category", variant: "destructive" });
      return;
    }

    setCategories(
      categories.map((c) =>
        c.id === editingCategory.id ? { ...c, ...data } : c
      )
    );
    setEditingCategory(null);
    setIsFormOpen(false);
    toast({ title: "Category updated successfully" });
  };

  // Delete category and all related products handler
  const handleDelete = async () => {
    if (!deleteCategory) return;

    try {
      // 1. Delete all products associated with the category
      const { error: productDeleteError } = await supabase
        .from("products")
        .delete()
        .eq("category_id", deleteCategory.id);

      if (productDeleteError) {
        toast({
          title: "Failed to delete products",
          description: productDeleteError.message,
          variant: "destructive",
        });
        return;
      }

      // 2. Delete the category
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

      // Update local state to remove deleted category
      setCategories(categories.filter((c) => c.id !== deleteCategory.id));
      setDeleteCategory(null);
      toast({ title: "Category and its products deleted successfully" });
    } catch (error) {
      toast({
        title: "Deletion error",
        description: error.message || "An error occurred during deletion",
        variant: "destructive",
      });
    }
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
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="bg-surface-light border-border"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Package className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>
                      You have {category.products} products.
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
                          onClick={() => setDeleteCategory(category)}
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
              Are you sure you want to delete "{deleteCategory?.name}"? This
              will also delete all products belonging to this category. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
