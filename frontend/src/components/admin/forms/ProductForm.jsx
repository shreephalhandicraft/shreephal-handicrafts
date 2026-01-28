import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ImageUploadDirect from "@/components/ImageUploadDirect.jsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { 
  TrendingUp, 
  Package, 
  Trash2, 
  AlertCircle,
  ShoppingCart
} from "lucide-react";

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
  const [price, setPrice] = useState(product?.price || 0);
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
  
  // Track original variants to detect changes
  const originalVariantsRef = useRef([]);

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
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .select(`
            id, 
            sku, 
            size_display, 
            size_numeric, 
            size_unit, 
            price_tier, 
            price, 
            stock_quantity
          `)
          .eq("product_id", product?.id)
          .order("created_at", { ascending: true });
        
        if (error) throw error;

        if (data && data.length > 0) {
          const variantsWithOrderCount = await Promise.all(
            data.map(async (variant) => {
              const { count, error: countError } = await supabase
                .from("order_items")
                .select("*", { count: "exact", head: true })
                .eq("variant_id", variant.id);
              
              return {
                ...variant,
                order_count: countError ? 0 : (count || 0)
              };
            })
          );
          
          setVariants(variantsWithOrderCount);
          originalVariantsRef.current = JSON.parse(JSON.stringify(variantsWithOrderCount));
          
          const validPrices = variantsWithOrderCount
            .map(v => parseFloat(v.price))
            .filter(p => !isNaN(p) && p > 0);
          
          if (validPrices.length > 0) {
            setPrice(Math.min(...validPrices));
          }
        } else {
          setVariants([]);
          originalVariantsRef.current = [];
        }
      } catch (error) {
        console.error("Fetch variants error:", error);
        toast({
          title: "Failed to load variants",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingVariants(false);
      }
    }

    fetchCategoriesIfNeeded();
    if (product?.id) fetchVariants();
  }, [initialCategories, product, toast]);

  // Featured count validation
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

  // Update price and stock from variants
  useEffect(() => {
    if (variants.length > 0) {
      const validPrices = variants
        .map(v => parseFloat(v.price))
        .filter(p => !isNaN(p) && p > 0);
      
      if (validPrices.length > 0) {
        setPrice(Math.min(...validPrices));
      }

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

  const handleCustomizableFieldChange = (field) => (e) =>
    setCustomizableFields((prev) => ({ ...prev, [field]: e.target.checked }));

  const handleVariantChange = (idx, field, value) => {
    setVariants((vals) =>
      vals.map((v, i) => {
        if (i !== idx) return v;
        
        const updated = { ...v, [field]: value };
        
        // Only update SKU when price_tier is MANUALLY changed
        if (field === 'price_tier' && catalogNumber) {
          updated.sku = `${catalogNumber}-${value}`;
        }
        
        return updated;
      })
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
    
    const nextTier = String.fromCharCode(65 + variants.length);
    
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
        stock_quantity: "",
        order_count: 0
      },
    ]);
  };

  // ✅ HARD DELETE - Permanent removal
  const removeVariant = async (idx, variantId) => {
    try {
      if (!variantId) {
        // New unsaved variant - just remove from UI
        setVariants((vars) => vars.filter((_, i) => i !== idx));
        return;
      }

      // Confirm deletion
      if (!window.confirm('Are you sure? This variant will be permanently deleted. This action cannot be undone.')) {
        return;
      }

      // Hard delete
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", variantId);
      
      if (error) throw error;
      
      setVariants((vars) => vars.filter((_, i) => i !== idx));
      
      toast({ 
        title: "Variant deleted", 
        description: "Size removed permanently. Orders are preserved with snapshot data."
      });
    } catch (err) {
      console.error("Remove variant error:", err);
      toast({
        title: "Failed to delete variant",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Helper to check if variant has changed
  const hasVariantChanged = (current, original) => {
    if (!original) return true;
    
    return (
      current.size_display !== original.size_display ||
      current.size_numeric !== original.size_numeric ||
      current.size_unit !== original.size_unit ||
      current.price_tier !== original.price_tier ||
      current.sku !== original.sku ||
      parseFloat(current.price) !== parseFloat(original.price) ||
      Number(current.stock_quantity) !== Number(original.stock_quantity)
    );
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

    if (!catalogNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Catalog number is required.",
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
    
    if (variants.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one size variant is required.",
        variant: "destructive",
      });
      return;
    }

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
        description: "Each variant must have complete data.",
        variant: "destructive",
      });
      return;
    }

    const skus = variants.map(v => v.sku).filter(Boolean);
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      toast({
        title: "Validation Error",
        description: "Duplicate SKUs detected.",
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

    const updatedProduct = {
      id: product.id,
      title: title.trim(),
      description: description.trim(),
      category_id: categoryId,
      image_url: imageUrl,
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

    // Check if ANY variant actually changed
    const existingVariants = variants.filter(v => v.id !== undefined);
    
    const hasAnyVariantChanged = existingVariants.some((v) => {
      const originalVariant = originalVariantsRef.current.find(ov => ov.id === v.id);
      return hasVariantChanged(v, originalVariant);
    });

    // Skip variant updates entirely if nothing changed
    if (!hasAnyVariantChanged) {
      toast({ 
        title: "Product saved successfully", 
        description: "Product details updated",
      });
      return;
    }

    let updatedCount = 0;
    let insertedCount = 0;
    
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      
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
        const originalVariant = originalVariantsRef.current.find(ov => ov.id === v.id);
        
        if (hasVariantChanged(v, originalVariant)) {
          const { error } = await supabase
            .from("product_variants")
            .update(variantData)
            .eq("id", v.id);
          
          if (error) {
            console.error("Update variant error:", error);
            toast({
              title: "Failed to update size",
              description: error.message,
              variant: "destructive",
            });
          } else {
            updatedCount++;
          }
        }
      } else {
        const { error } = await supabase
          .from("product_variants")
          .insert([{
            ...variantData,
            product_id: product.id,
            created_at: new Date().toISOString(),
          }]);
        
        if (error) {
          console.error("Insert variant error:", error);
          toast({
            title: "Failed to add size",
            description: error.message,
            variant: "destructive",
          });
        } else {
          insertedCount++;
        }
      }
    }

    const messages = [];
    if (updatedCount > 0) messages.push(`${updatedCount} variant(s) updated`);
    if (insertedCount > 0) messages.push(`${insertedCount} variant(s) added`);
    
    toast({ 
      title: "Product saved successfully", 
      description: messages.length > 0 ? messages.join(", ") : "No changes to variants",
    });
  };

  return (
    <form onSubmit={validateAndSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
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
            Minimum price from variants
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
          />  
          )}
        </div>

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
            Based on variant inventory
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
            <p className="text-xs text-red-600 mt-1">Maximum limit reached</p>
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
            Used for SKU generation
          </p>
        </div>

        {/* VARIANTS SECTION */}
        <fieldset className="border border-gray-300 rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <legend className="text-base font-semibold text-gray-800">
              Sizes & Variants (max 3)
            </legend>
          </div>

          {loadingVariants ? (
            <div className="text-sm text-gray-500">Loading sizes...</div>
          ) : (
            <>
              {variants.map((variant, idx) => {
                const hasOrders = (variant.order_count || 0) > 0;
                
                return (
                  <div
                    key={variant.id || idx}
                    className="border rounded-lg p-4 mb-4 bg-white"
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="default" className="bg-green-500">
                        Active
                      </Badge>
                      {hasOrders && (
                        <Badge variant="outline" className="border-blue-500 text-blue-700">
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          {variant.order_count} order{variant.order_count > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {hasOrders && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-blue-900 font-medium">
                            ℹ️ This variant has {variant.order_count} order(s)
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Orders will preserve snapshot data if deleted.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">SKU</Label>
                        <Input
                          value={variant.sku || `${catalogNumber}-${String.fromCharCode(65 + idx)}`}
                          disabled
                          className="bg-gray-100 text-gray-700 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Size Display <span className="text-red-600">*</span></Label>
                        <Input
                          placeholder="6 INCH"
                          value={variant.size_display}
                          onChange={(e) => handleVariantChange(idx, "size_display", e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Size (Number)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="6.0"
                          value={variant.size_numeric}
                          onChange={(e) => handleVariantChange(idx, "size_numeric", e.target.value)}
                        />
                      </div>

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

                      <div>
                        <Label className="text-xs">Tier <span className="text-red-600">*</span></Label>
                        <select
                          value={variant.price_tier || String.fromCharCode(65 + idx)}
                          onChange={(e) => handleVariantChange(idx, "price_tier", e.target.value)}
                          className="w-full border rounded p-2 text-sm"
                          required
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                        </select>
                      </div>

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

                      <div className="md:col-span-2">
                        <Label className="text-xs">
                          Stock Quantity <span className="text-red-600">*</span>
                        </Label>
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

                    <div className="flex gap-2 mt-4">
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeVariant(idx, variant.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Permanently
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {variants.length < 3 && (
                <Button 
                  type="button" 
                  onClick={addVariant} 
                  variant="outline" 
                  className="w-full"
                >
                  + Add Size Variant
                </Button>
              )}
              
              {variants.length === 0 && (
                <p className="text-sm text-gray-600 mb-3">
                  Add at least one size variant
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
