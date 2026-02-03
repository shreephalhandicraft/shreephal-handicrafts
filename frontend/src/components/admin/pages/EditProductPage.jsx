import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import ImageUploadDirect from "@/components/ImageUploadDirect.jsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Loader2, Trash2, AlertTriangle } from "lucide-react";

// ✅ Custom Toggle Component (no Radix UI dependency)
const Toggle = ({ id, checked, onChange, disabled = false, children }) => (
  <div className="flex items-center space-x-2">
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        id={id}
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
    </label>
    {children && (
      <Label htmlFor={id} className="cursor-pointer">
        {children}
      </Label>
    )}
  </div>
);

export default function EditProductPage() {
  const { productId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [inStock, setInStock] = useState(false);
  
  // ✅ 2️⃣ NEW: Is Active toggle
  const [isActive, setIsActive] = useState(true);
  
  const [featured, setFeatured] = useState(false);
  const [featuredCount, setFeaturedCount] = useState(0);
  
  // ❌ 1️⃣ REMOVED: customizableFields state (UI-only removal)
  
  const [gst_5pct, setGst5pct] = useState(false);
  const [gst_18pct, setGst18pct] = useState(false);
  const [catalogNumber, setCatalogNumber] = useState("");

  // Variants (maximum 3)
  const [variants, setVariants] = useState([
    { id: null, size: "", price: "", stock_quantity: "" },
  ]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch product
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (productError) throw productError;

        // Populate form
        setTitle(product.title || "");
        setDescription(product.description || "");
        setPrice(product.price || "");
        setCategoryId(product.category_id || "");
        setImageUrl(product.image_url || "");
        setInStock(product.in_stock || false);
        setIsActive(product.is_active !== false); // ✅ Default true if not set
        setFeatured(product.featured || false);
        setGst5pct(product.gst_5pct || false);
        setGst18pct(product.gst_18pct || false);
        setCatalogNumber(product.catalog_number || "");

        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .order("created_at");

        if (!variantError && variantData && variantData.length > 0) {
          setVariants(
            variantData.map((v) => ({
              id: v.id,
              size: v.size_display,
              price: v.price,
              stock_quantity: v.stock_quantity,
            }))
          );
        }

        // Fetch categories
        const { data: catData, error: catError } = await supabase
          .from("categories")
          .select("id, name")
          .order("name");

        if (catError) throw catError;
        setCategories(catData || []);

        // Fetch featured count
        const { count, error: countError } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("featured", true)
          .neq("id", productId);

        if (!countError) setFeaturedCount(count);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error loading product",
          description: error.message,
          variant: "destructive",
        });
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchData();
    }
  }, [productId, navigate, toast]);

  const onUploadSuccess = (imgData) => {
    setImageUrl(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleVariantChange = (idx, field, value) => {
    setVariants((current) =>
      current.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const addVariant = () => {
    if (variants.length < 3) {
      setVariants([...variants, { id: null, size: "", price: "", stock_quantity: "" }]);
    }
  };

  const removeVariant = (idx) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== idx));
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
        description: "Maximum 4 featured products allowed.",
        variant: "destructive",
      });
      return;
    }

    if (
      variants.some(
        (v) =>
          !v.size ||
          !v.price ||
          Number(v.price) <= 0 ||
          !v.stock_quantity ||
          Number(v.stock_quantity) < 0
      )
    ) {
      toast({
        title: "Validation Error",
        description: "Each variant must have size, price (>0), and stock (>=0).",
        variant: "destructive",
      });
      return;
    }
    
    if (variants.length > 3) {
      toast({
        title: "Validation Error",
        description: "Maximum 3 sizes allowed.",
        variant: "destructive",
      });
      return;
    }

    // Update main product
    const updatedProduct = {
      title: title.trim(),
      description: description.trim(),
      price: price ? parseFloat(price) : null,
      category_id: categoryId,
      image_url: imageUrl,
      in_stock: inStock,
      is_active: isActive, // ✅ 2️⃣ NEW: Save is_active state
      featured,
      catalog_number: catalogNumber.trim(),
      gst_5pct,
      gst_18pct,
      updated_at: new Date().toISOString(),
    };

    const { error: productError } = await supabase
      .from("products")
      .update(updatedProduct)
      .eq("id", productId);

    if (productError) {
      toast({
        title: "Failed to update product",
        description: productError.message,
        variant: "destructive",
      });
      return;
    }

    // Handle variants
    const { error: deleteError } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId);

    if (deleteError) {
      toast({
        title: "Failed to update variants",
        description: deleteError.message,
        variant: "destructive",
      });
      return;
    }

    const variantsToInsert = variants.map((v) => ({
      product_id: productId,
      size_display: v.size,
      price: parseFloat(v.price),
      stock_quantity: Number(v.stock_quantity),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert(variantsToInsert);

    if (variantError) {
      toast({
        title: "Failed to update variants",
        description: variantError.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Product updated successfully" });
    navigate("/admin/products");
  };

  // ✅ 3️⃣ NEW: Hard delete function
  const handleHardDelete = async () => {
    try {
      // Delete variants first (foreign key constraint)
      const { error: variantError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId);

      if (variantError) throw variantError;

      // Delete product
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (productError) throw productError;

      toast({
        title: "Product deleted permanently",
        description: "This action cannot be undone.",
      });
      navigate("/admin/products");
    } catch (error) {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading product...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/products")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <form
        onSubmit={validateAndSubmit}
        className="bg-white rounded-lg shadow-md p-8 space-y-8"
        noValidate
      >
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">
          Edit Product
        </h2>

        {/* Product Title */}
        <div className="flex flex-col">
          <Label htmlFor="title" className="mb-1 font-medium text-gray-700">
            Product Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Enter product title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Product Description */}
        <div className="flex flex-col">
          <Label htmlFor="description" className="mb-1 font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="description"
            rows="4"
            placeholder="Describe your product..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="resize-none rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Base Price */}
        <div className="flex flex-col">
          <Label htmlFor="price" className="mb-1 font-medium text-gray-700">
            Base Price (₹) <span className="text-gray-500 text-sm">(auto-computed)</span>
          </Label>
          <Input
            id="price"
            type="number"
            placeholder="Auto-computed from variants"
            value={price}
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">
            ℹ️ Calculated from lowest variant price
          </p>
        </div>

        {/* Category */}
        <div className="flex flex-col">
          <Label htmlFor="category" className="mb-1 font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border rounded-md p-2 focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option value={cat.id} key={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Image Upload */}
        <div className="flex flex-col">
          <Label className="mb-1 font-medium text-gray-700">Product Image</Label>
          <ImageUploadDirect
            onUploadSuccess={onUploadSuccess}
            maxFiles={1}
            folder="shreephal-handicrafts/products"
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Product"
              className="mt-4 w-32 h-32 object-cover rounded-md shadow-sm"
            />
          )}
        </div>

        {/* Sizes & Variants */}
        <fieldset className="border rounded-md p-4">
          <legend className="text-lg font-semibold mb-4">
            Sizes & Variants (max 3) <span className="text-red-500">*</span>
          </legend>
          {variants.map((variant, idx) => (
            <div key={idx} className="mb-4 flex gap-4 border p-4 rounded-md">
              <div className="flex-1">
                <Label htmlFor={`size-${idx}`}>Size *</Label>
                <Input
                  id={`size-${idx}`}
                  placeholder="e.g. 6 INCH"
                  value={variant.size}
                  onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`price-${idx}`}>Price (₹) *</Label>
                <Input
                  id={`price-${idx}`}
                  type="number"
                  placeholder="Price"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`stock-${idx}`}>Stock *</Label>
                <Input
                  id={`stock-${idx}`}
                  type="number"
                  placeholder="Stock"
                  value={variant.stock_quantity}
                  onChange={(e) => handleVariantChange(idx, "stock_quantity", e.target.value)}
                  required
                />
              </div>
              {variants.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeVariant(idx)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          {variants.length < 3 && (
            <Button type="button" onClick={addVariant} variant="outline">
              Add Size
            </Button>
          )}
        </fieldset>

        {/* In Stock */}
        <Toggle
          id="inStock"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
        >
          In Stock
        </Toggle>

        {/* ✅ 2️⃣ NEW: Is Active Toggle */}
        <Toggle
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        >
          Is Active (Product visible to customers)
        </Toggle>

        {/* Featured */}
        <Toggle
          id="featured"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          disabled={featuredCount >= 4 && !featured}
        >
          Featured (max 4)
        </Toggle>

        {/* ❌ 1️⃣ REMOVED: Customization Options Fieldset */}

        {/* GST */}
        <fieldset className="border rounded-md p-4 space-y-4">
          <legend className="text-lg font-semibold">GST Tax Rate</legend>
          <Toggle
            id="gst-5pct"
            checked={gst_5pct}
            onChange={(e) => {
              setGst5pct(e.target.checked);
              if (e.target.checked) setGst18pct(false);
            }}
          >
            GST 5%
          </Toggle>
          <Toggle
            id="gst-18pct"
            checked={gst_18pct}
            onChange={(e) => {
              setGst18pct(e.target.checked);
              if (e.target.checked) setGst5pct(false);
            }}
          >
            GST 18%
          </Toggle>
        </fieldset>

        {/* Catalog Number */}
        <div className="flex flex-col">
          <Label htmlFor="catalogNumber">Catalog Number (optional)</Label>
          <Input
            id="catalogNumber"
            placeholder="Enter catalog number"
            value={catalogNumber}
            onChange={(e) => setCatalogNumber(e.target.value)}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/products")}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            Update Product
          </Button>
        </div>

        {/* ✅ 3️⃣ NEW: Danger Zone - Hard Delete */}
        <div className="border-t-2 border-red-100 pt-6 mt-8">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Danger Zone</h3>
                <p className="text-sm text-red-700 mb-3">
                  Permanently delete this product. This action cannot be undone.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product Permanently
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ✅ 3️⃣ NEW: Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-medium text-gray-900">
                This will permanently delete "{title}" and all its variants.
              </p>
              <p className="text-sm">
                This action <strong>cannot be undone</strong>. All product data, including:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 text-gray-700">
                <li>Product details and images</li>
                <li>All size variants and stock</li>
                <li>Sales history (if any)</li>
              </ul>
              <p className="text-sm font-medium text-red-600">
                will be permanently removed from the database.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Yes, Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
