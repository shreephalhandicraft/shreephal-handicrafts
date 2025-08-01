import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUpload from "@/components/ImageUpload.jsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function EditProductForm({
  product,
  categories: initialCategories,
  onSubmit,
  onCancel,
}) {
  const { toast } = useToast();

  // Main product states
  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [categories, setCategories] = useState(initialCategories || []);
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [inStock, setInStock] = useState(product?.in_stock || false);
  const [featured, setFeatured] = useState(product?.featured || false);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [customizableFields, setCustomizableFields] = useState({
    text_input: product?.customizable_fields?.text_input || false,
    image_upload: product?.customizable_fields?.image_upload || false,
  });
  const [catalogNumber, setCatalogNumber] = useState(
    product?.catalog_number || ""
  );

  // Variants
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(true);

  // Fetch categories & variants
  useEffect(() => {
    async function fetchCategoriesIfNeeded() {
      if (!initialCategories || initialCategories.length === 0) {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name");
        if (!error) setCategories(data || []);
      }
    }

    async function fetchVariants() {
      setLoadingVariants(true);
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, size_code, price, stock_quantity")
        .eq("product_id", product?.id);
      if (!error) setVariants(data || []);
      else
        toast({
          title: "Failed to load sizes",
          description: error.message,
          variant: "destructive",
        });
      setLoadingVariants(false);
    }

    fetchCategoriesIfNeeded();
    if (product?.id) fetchVariants();
  }, [initialCategories, product, toast]);

  // Featured count for validation
  useEffect(() => {
    async function fetchFeaturedCount() {
      try {
        let query = supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("featured", true);
        if (product?.id) query = query.neq("id", product.id);
        let { count, error } = await query;
        if (!error) setFeaturedCount(count);
      } catch {
        // Silent
      }
    }
    fetchFeaturedCount();
  }, [product]);

  const onUploadSuccess = (imgData) => {
    setImageUrl(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const handleCustomizableFieldChange = (field) => (e) =>
    setCustomizableFields((prev) => ({ ...prev, [field]: e.target.checked }));

  const handleVariantChange = (idx, field, value) => {
    setVariants((vals) =>
      vals.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const addVariant = () => {
    if (variants.length >= 3) {
      toast({
        title: "Limit reached",
        description: "Maximum 3 sizes allowed.",
        variant: "destructive",
      });
      return;
    }
    setVariants([
      ...variants,
      { id: undefined, size_code: "", price: "", stock_quantity: "" },
    ]);
  };

  const removeVariant = async (idx, variantId) => {
    try {
      if (variantId) {
        const { error } = await supabase
          .from("product_variants")
          .delete()
          .eq("id", variantId);
        if (error) throw error;
        toast({ title: "Product size removed" });
      }
      setVariants((vars) => vars.filter((_, i) => i !== idx));
    } catch (err) {
      console.error("Delete variant error:", err);
      toast({
        title: "Failed to remove size",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const validateAndSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }
    if (!price || Number(price) < 0) {
      toast({
        title: "Validation Error",
        description: "Price must be a positive number.",
        variant: "destructive",
      });
      return;
    }
    if (!categoryId) {
      toast({
        title: "Validation Error",
        description: "Please select a category.",
        variant: "destructive",
      });
      return;
    }
    if (featured && featuredCount >= 4) {
      toast({
        title: "Featured limit reached",
        description:
          "Maximum 4 featured products allowed. Unfeature one before updating.",
        variant: "destructive",
      });
      return;
    }
    if (
      variants.some(
        (v) =>
          !v.size_code ||
          !v.price ||
          Number(v.price) <= 0 ||
          !v.stock_quantity ||
          Number(v.stock_quantity) < 0
      )
    ) {
      toast({
        title: "Validation Error",
        description:
          "Each size must have size, price (>0), and stock quantity (>=0).",
        variant: "destructive",
      });
      return;
    }
    if (variants.length > 3) {
      toast({
        title: "Validation Error",
        description: "You can add a maximum of 3 sizes only.",
        variant: "destructive",
      });
      return;
    }

    const updatedProduct = {
      id: product.id,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category_id: categoryId,
      image_url: imageUrl,
      in_stock: inStock,
      customizable_fields: customizableFields,
      featured,
      catalog_number: catalogNumber.trim(),
    };

    try {
      await onSubmit(updatedProduct);
    } catch (error) {
      toast({
        title: "Failed to update product",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
      return;
    }

    for (const v of variants) {
      if (v.id) {
        const { error } = await supabase
          .from("product_variants")
          .update({
            size_code: v.size_code,
            price: parseFloat(v.price),
            stock_quantity: Number(v.stock_quantity),
            updated_at: new Date().toISOString(),
          })
          .eq("id", v.id);
        if (error) {
          toast({
            title: "Failed to update size",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        const { error } = await supabase.from("product_variants").insert([
          {
            product_id: product.id,
            size_code: v.size_code,
            price: parseFloat(v.price),
            stock_quantity: Number(v.stock_quantity),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        if (error) {
          toast({
            title: "Failed to add size",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    }

    toast({ title: "Product saved successfully" });
  };

  return (
    <form onSubmit={validateAndSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>Edit Product</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="price">Price (base)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Image</Label>
          <ImageUpload
            onUploadSuccess={onUploadSuccess}
            onUploadStart={handleUploadStart}
          />
          {uploading && (
            <p className="text-sm text-blue-600 mt-1 animate-pulse">
              Uploading image...
            </p>
          )}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Product"
              className="mt-4 w-28 h-28 object-cover rounded shadow border"
            />
          )}
        </div>

        <div>
          <Label>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="mr-2"
            />
            In Stock
          </Label>
        </div>

        <div>
          <Label>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="mr-2"
              disabled={featuredCount >= 4 && !featured}
            />
            Featured (max 4)
          </Label>
        </div>

        <fieldset className="border border-gray-300 rounded-md p-4 space-y-2">
          <legend className="text-base font-semibold text-gray-800">
            Customization Options
          </legend>
          <Label>
            <input
              type="checkbox"
              checked={customizableFields.text_input}
              onChange={handleCustomizableFieldChange("text_input")}
              className="mr-2"
            />
            Allow Custom Text Input
          </Label>
          <Label>
            <input
              type="checkbox"
              checked={customizableFields.image_upload}
              onChange={handleCustomizableFieldChange("image_upload")}
              className="mr-2"
            />
            Allow Custom Image Upload
          </Label>
        </fieldset>

        <div>
          <Label>Catalog Number (optional)</Label>
          <Input
            value={catalogNumber}
            onChange={(e) => setCatalogNumber(e.target.value)}
          />
        </div>

        <fieldset className="border border-gray-300 rounded-md p-4">
          <legend className="text-base font-semibold text-gray-800">
            Sizes & Variants (max 3)
          </legend>

          {loadingVariants ? (
            <div className="text-sm text-gray-500">Loading sizes...</div>
          ) : (
            <>
              {variants.map((variant, idx) => (
                <div
                  key={variant.id || idx}
                  className="flex gap-2 items-end mb-2"
                >
                  <Input
                    placeholder="Size (e.g. 6, 6.5, 7)"
                    value={variant.size_code}
                    onChange={(e) =>
                      handleVariantChange(idx, "size_code", e.target.value)
                    }
                    required
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={variant.price}
                    onChange={(e) =>
                      handleVariantChange(idx, "price", e.target.value)
                    }
                    required
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Stock Qty"
                    value={variant.stock_quantity}
                    onChange={(e) =>
                      handleVariantChange(idx, "stock_quantity", e.target.value)
                    }
                    required
                  />
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeVariant(idx, variant.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {variants.length < 3 && (
                <Button type="button" onClick={addVariant}>
                  Add Size
                </Button>
              )}
            </>
          )}
        </fieldset>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
