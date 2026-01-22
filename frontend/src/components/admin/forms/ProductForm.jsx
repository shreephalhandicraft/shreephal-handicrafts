import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUploadDirect from "@/components/ImageUploadDirect.jsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { TrendingUp, Package } from "lucide-react";

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
  const [price, setPrice] = useState(product?.price || 0); // Read-only, auto-computed
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [categories, setCategories] = useState(initialCategories || []);
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [inStock, setInStock] = useState(product?.in_stock || false); // Read-only, auto-computed
  const [featured, setFeatured] = useState(product?.featured || false);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [customizableFields, setCustomizableFields] = useState({
    text_input: product?.customizable_fields?.text_input || false,
    image_upload: product?.customizable_fields?.image_upload || false,
  });
  const [catalogNumber, setCatalogNumber] = useState(
    product?.catalog_number || ""
  );

  // Variants with new schema fields
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
      // ✅ CHANGE #3: Fetch new variant fields
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, sku, size_display, size_numeric, size_unit, price_tier, price, stock_quantity")
        .eq("product_id", product?.id);
      
      if (!error) {
        setVariants(data || []);
        // Update price from variants (minimum price)
        if (data && data.length > 0) {
          const minPrice = Math.min(...data.map(v => v.price));
          setPrice(minPrice);
        }
      } else {
        toast({
          title: "Failed to load sizes",
          description: error.message,
          variant: "destructive",
        });
      }
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

  // ✅ Update price and stock when variants change
  useEffect(() => {
    if (variants.length > 0) {
      // Auto-compute minimum price
      const validPrices = variants
        .map(v => parseFloat(v.price))
        .filter(p => !isNaN(p) && p > 0);
      
      if (validPrices.length > 0) {
        setPrice(Math.min(...validPrices));
      }

      // Auto-compute stock status
      const hasStock = variants.some(v => Number(v.stock_quantity) > 0);
      setInStock(hasStock);
    } else {
      setPrice(0);
      setInStock(false);
    }
  }, [variants]);

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

  // ✅ CHANGE #5: Enhanced variant change handler with SKU generation
  const handleVariantChange = (idx, field, value) => {
    setVariants((vals) =>
      vals.map((v, i) => {
        if (i !== idx) return v;
        
        const updated = { ...v, [field]: value };
        
        // Auto-generate SKU when catalog number or tier changes
        if ((field === 'price_tier' || field === 'size_display') && catalogNumber) {
          const tier = field === 'price_tier' ? value : (v.price_tier || String.fromCharCode(65 + idx));
          updated.sku = `${catalogNumber}-${tier}`;
        }
        
        return updated;
      })
    );
  };

  // ✅ CHANGE #5: Enhanced add variant with new fields
  const addVariant = () => {
    if (variants.length >= 3) {
      toast({
        title: "Limit reached",
        description: "Maximum 3 sizes allowed.",
        variant: "destructive",
      });
      return;
    }
    
    const nextTier = String.fromCharCode(65 + variants.length); // A, B, C
    
    setVariants([
      ...variants,
      { 
        id: undefined, 
        sku: catalogNumber ? `${catalogNumber}-${nextTier}` : '',
        size_display: "", 
        size_numeric: "",
        size_unit: "inch",
        price_tier: nextTier,
        price: "", 
        stock_quantity: "" 
      },
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

  // ✅ Update SKUs when catalog number changes
  useEffect(() => {
    if (catalogNumber) {
      setVariants(vars => vars.map((v, idx) => ({
        ...v,
        sku: `${catalogNumber}-${v.price_tier || String.fromCharCode(65 + idx)}`
      })));
    }
  }, [catalogNumber]);

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

    // ✅ CHANGE #6: Validate catalog number (now required)
    if (!catalogNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Catalog number is required (e.g., SM-1614, MH-2401).",
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

    // ✅ CHANGE #6: Enhanced variant validation
    if (variants.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one size variant is required.",
        variant: "destructive",
      });
      return;
    }

    // Validate all variants have required new fields
    if (variants.some(v => 
      !v.size_display || 
      !v.price_tier || 
      !v.sku ||
      !v.price ||
      Number(v.price) <= 0 ||
      v.stock_quantity === undefined ||
      v.stock_quantity === '' ||
      Number(v.stock_quantity) < 0
    )) {
      toast({
        title: "Validation Error",
        description: "Each variant must have size display, price tier, SKU, valid price (>0), and stock quantity (≥0).",
        variant: "destructive",
      });
      return;
    }

    // ✅ CHANGE #6: Validate SKU uniqueness
    const skus = variants.map(v => v.sku).filter(Boolean);
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      toast({
        title: "Validation Error",
        description: "Duplicate SKUs detected. Each variant must have unique SKU.",
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

    // ✅ CHANGE #6: Remove price and in_stock from product save
    const updatedProduct = {
      id: product.id,
      title: title.trim(),
      description: description.trim(),
      // price will auto-update via trigger
      category_id: categoryId,
      image_url: imageUrl,
      // in_stock will auto-update via trigger
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

    // ✅ CHANGE #5: Save variants with new fields
    for (const v of variants) {
      const variantData = {
        size_display: v.size_display,
        size_numeric: v.size_numeric ? parseFloat(v.size_numeric) : null,
        size_unit: v.size_unit || 'inch',
        price_tier: v.price_tier,
        sku: v.sku || `${catalogNumber}-${v.price_tier}`,
        price: parseFloat(v.price),
        stock_quantity: Number(v.stock_quantity),
        updated_at: new Date().toISOString(),
      };

      if (v.id) {
        // Update existing variant
        const { error } = await supabase
          .from("product_variants")
          .update(variantData)
          .eq("id", v.id);
        
        if (error) {
          toast({
            title: "Failed to update size",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Insert new variant
        const { error } = await supabase
          .from("product_variants")
          .insert([{
            ...variantData,
            product_id: product.id,
            created_at: new Date().toISOString(),
          }]);
        
        if (error) {
          toast({
            title: "Failed to add size",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    }

    toast({ title: "Product saved successfully", description: "Price and stock status updated automatically." });
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

        {/* ✅ CHANGE #1: Read-only auto-computed price */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <Label className="text-sm font-semibold text-blue-900">
              Base Price (Auto-Computed)
            </Label>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            ₹{price || 0}
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Automatically set to the minimum variant price
          </p>
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
          <ImageUploadDirect
            onUploadSuccess={onUploadSuccess}
            maxFiles={1}
            folder="shreephal-handicrafts/products"
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

        {/* ✅ CHANGE #2: Read-only auto-computed stock status */}
        <div className={`border rounded-lg p-4 ${
          inStock ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Package className={`w-4 h-4 ${inStock ? 'text-green-600' : 'text-red-600'}`} />
            <Label className={`text-sm font-semibold ${
              inStock ? 'text-green-900' : 'text-red-900'
            }`}>
              Stock Status (Auto-Computed)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              inStock ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="font-medium text-lg">{inStock ? 'In Stock' : 'Out of Stock'}</span>
          </div>
          <p className={`text-xs mt-1 ${
            inStock ? 'text-green-600' : 'text-red-600'
          }`}>
            Updates automatically based on variant inventory
          </p>
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
          {featuredCount >= 4 && !featured && (
            <p className="text-xs text-red-600 mt-1">Maximum featured products limit reached</p>
          )}
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
          <Label htmlFor="catalogNumber">Catalog Number <span className="text-red-600">*</span></Label>
          <Input
            id="catalogNumber"
            value={catalogNumber}
            onChange={(e) => setCatalogNumber(e.target.value.toUpperCase())}
            placeholder="e.g., SM-1614, MH-2401"
            required
          />
          <p className="text-xs text-gray-600 mt-1">
            Used for SKU generation. Format: PREFIX-NUMBER (e.g., SM-1614)
          </p>
        </div>

        {/* ✅ CHANGE #4: Enhanced variants with new fields */}
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
                  className="border border-gray-300 rounded-lg p-4 mb-4 bg-gray-50"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* SKU Display/Input */}
                    <div>
                      <Label className="text-xs">SKU (Auto-Generated)</Label>
                      <Input
                        value={variant.sku || `${catalogNumber}-${String.fromCharCode(65 + idx)}`}
                        disabled
                        className="bg-gray-100 text-gray-700 font-mono text-sm"
                      />
                    </div>

                    {/* Size Display */}
                    <div>
                      <Label className="text-xs">Size Display <span className="text-red-600">*</span></Label>
                      <Input
                        placeholder="6 INCH"
                        value={variant.size_display}
                        onChange={(e) => handleVariantChange(idx, "size_display", e.target.value)}
                        required
                      />
                    </div>

                    {/* Size Numeric */}
                    <div>
                      <Label className="text-xs">Size (Number)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="6.0"
                        value={variant.size_numeric}
                        onChange={(e) => handleVariantChange(idx, "size_numeric", e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-0.5">For filtering</p>
                    </div>

                    {/* Size Unit */}
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <select
                        value={variant.size_unit || 'inch'}
                        onChange={(e) => handleVariantChange(idx, "size_unit", e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                      >
                        <option value="inch">Inch</option>
                        <option value="cm">CM</option>
                        <option value="mm">MM</option>
                        <option value="unit">Unit (S/M/L)</option>
                      </select>
                    </div>

                    {/* Price Tier */}
                    <div>
                      <Label className="text-xs">Tier <span className="text-red-600">*</span></Label>
                      <select
                        value={variant.price_tier || String.fromCharCode(65 + idx)}
                        onChange={(e) => handleVariantChange(idx, "price_tier", e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        required
                      >
                        <option value="A">A (Smallest/Cheapest)</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="S">S (Small)</option>
                        <option value="M">M (Medium)</option>
                        <option value="L">L (Large)</option>
                        <option value="XL">XL (Extra Large)</option>
                        <option value="G">G (Gold)</option>
                        <option value="S">S (Silver)</option>
                        <option value="B">B (Bronze)</option>
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <Label className="text-xs">Price (₹) <span className="text-red-600">*</span></Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="60"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                        required
                      />
                    </div>

                    {/* Stock */}
                    <div className="md:col-span-2">
                      <Label className="text-xs">Stock Quantity <span className="text-red-600">*</span></Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="100"
                        value={variant.stock_quantity}
                        onChange={(e) => handleVariantChange(idx, "stock_quantity", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-3"
                      onClick={() => removeVariant(idx, variant.id)}
                    >
                      Remove Variant
                    </Button>
                  )}
                </div>
              ))}
              {variants.length < 3 && (
                <Button type="button" onClick={addVariant} variant="outline" className="w-full">
                  + Add Size Variant
                </Button>
              )}
              {variants.length === 0 && (
                <p className="text-sm text-gray-600 mb-3">
                  Add at least one size variant to enable product
                </p>
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
