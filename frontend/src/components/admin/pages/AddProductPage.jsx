import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUploadDirect from "@/components/ImageUploadDirect.jsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { TrendingUp, Package, Info } from "lucide-react";

export default function AddProductPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewPrice, setPreviewPrice] = useState(0); // ✅ Real-time preview
  const [previewStock, setPreviewStock] = useState(false); // ✅ Real-time preview
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [customizableFields, setCustomizableFields] = useState({
    text_input: false,
    image_upload: false,
  });
  const [gst_5pct, setGst5pct] = useState(false);
  const [gst_18pct, setGst18pct] = useState(false);
  const [catalogNumber, setCatalogNumber] = useState("");

  // ✅ ENHANCED: Variants with all new fields
  const [variants, setVariants] = useState([
    {
      sku: "",
      size_display: "",
      size_numeric: "",
      size_unit: "inch",
      price_tier: "A",
      price: "",
      stock_quantity: "",
    },
  ]);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) {
        toast({ title: "Failed to load categories", variant: "destructive" });
      } else {
        setCategories(data || []);
      }
    }
    async function fetchFeaturedCount() {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("featured", true);
      if (!error) setFeaturedCount(count);
    }
    fetchCategories();
    fetchFeaturedCount();
  }, [toast]);

  // ✅ REAL-TIME: Update price and stock preview when variants change
  useEffect(() => {
    if (variants.length > 0) {
      // Auto-compute minimum price
      const validPrices = variants
        .map((v) => parseFloat(v.price))
        .filter((p) => !isNaN(p) && p > 0);

      if (validPrices.length > 0) {
        setPreviewPrice(Math.min(...validPrices));
      } else {
        setPreviewPrice(0);
      }

      // Auto-compute stock status
      const hasStock = variants.some((v) => {
        const qty = Number(v.stock_quantity);
        return !isNaN(qty) && qty > 0;
      });
      setPreviewStock(hasStock);
    } else {
      setPreviewPrice(0);
      setPreviewStock(false);
    }
  }, [variants]);

  // ✅ REAL-TIME: Update SKUs when catalog number changes
  useEffect(() => {
    if (catalogNumber.trim()) {
      setVariants((vars) =>
        vars.map((v) => ({
          ...v,
          sku: `${catalogNumber.trim()}-${v.price_tier}`,
        }))
      );
    }
  }, [catalogNumber]);

  const onUploadSuccess = (imgData) => {
    setImageUrl(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  // ✅ ENHANCED: Handle variant changes with SKU auto-generation
  const handleVariantChange = (idx, field, value) => {
    setVariants((current) =>
      current.map((v, i) => {
        if (i !== idx) return v;

        const updated = { ...v, [field]: value };

        // Auto-generate SKU when price_tier changes
        if (field === "price_tier" && catalogNumber.trim()) {
          updated.sku = `${catalogNumber.trim()}-${value}`;
        }

        return updated;
      })
    );
  };

  // ✅ ENHANCED: Add variant with new fields
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
        sku: catalogNumber.trim() ? `${catalogNumber.trim()}-${nextTier}` : "",
        size_display: "",
        size_numeric: "",
        size_unit: "inch",
        price_tier: nextTier,
        price: "",
        stock_quantity: "",
      },
    ]);
  };

  const removeVariant = (idx) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== idx));
    }
  };

  const handleCustomizableFieldChange = (field) => (e) => {
    setCustomizableFields((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  // ✅ COMPLETE VALIDATION
  const validateAndSubmit = async (e) => {
    e.preventDefault();

    // Validate title
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }

    // ✅ VALIDATION: Catalog number required
    if (!catalogNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Catalog number is required (e.g., SM-1614, MH-2401).",
        variant: "destructive",
      });
      return;
    }

    // ✅ VALIDATION: Catalog number format
    if (!/^[A-Z]{2,4}-\d{3,5}$/.test(catalogNumber.trim())) {
      toast({
        title: "Validation Error",
        description:
          "Catalog number must be in format: 2-4 letters, dash, 3-5 numbers (e.g., SM-1614)",
        variant: "destructive",
      });
      return;
    }

    // Validate category
    if (!categoryId) {
      toast({
        title: "Validation Error",
        description: "Please select a category.",
        variant: "destructive",
      });
      return;
    }

    // Validate featured limit
    if (featured && featuredCount >= 4) {
      toast({
        title: "Featured limit reached",
        description:
          "Maximum 4 featured products allowed. Unfeature one before adding.",
        variant: "destructive",
      });
      return;
    }

    // ✅ VALIDATION: At least one variant
    if (variants.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one size variant is required.",
        variant: "destructive",
      });
      return;
    }

    // ✅ VALIDATION: All required variant fields
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];

      if (!v.size_display || !v.size_display.trim()) {
        toast({
          title: "Validation Error",
          description: `Variant ${i + 1}: Size display is required.`,
          variant: "destructive",
        });
        return;
      }

      if (!v.price_tier || !v.price_tier.trim()) {
        toast({
          title: "Validation Error",
          description: `Variant ${i + 1}: Price tier is required.`,
          variant: "destructive",
        });
        return;
      }

      if (!v.sku || !v.sku.trim()) {
        toast({
          title: "Validation Error",
          description: `Variant ${i + 1}: SKU is required (check catalog number).`,
          variant: "destructive",
        });
        return;
      }

      if (!v.price || isNaN(parseFloat(v.price)) || parseFloat(v.price) <= 0) {
        toast({
          title: "Validation Error",
          description: `Variant ${i + 1}: Price must be greater than 0.`,
          variant: "destructive",
        });
        return;
      }

      if (
        v.stock_quantity === "" ||
        isNaN(Number(v.stock_quantity)) ||
        Number(v.stock_quantity) < 0
      ) {
        toast({
          title: "Validation Error",
          description: `Variant ${i + 1}: Stock quantity must be 0 or greater.`,
          variant: "destructive",
        });
        return;
      }

      // ✅ VALIDATION: Size numeric if provided
      if (v.size_numeric && isNaN(parseFloat(v.size_numeric))) {
        toast({
          title: "Validation Error",
          description: `Variant ${i + 1}: Size numeric must be a valid number.`,
          variant: "destructive",
        });
        return;
      }
    }

    // ✅ VALIDATION: SKU uniqueness
    const skus = variants.map((v) => v.sku.trim()).filter(Boolean);
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      toast({
        title: "Validation Error",
        description:
          "Duplicate SKUs detected. Each variant must have a unique SKU.",
        variant: "destructive",
      });
      return;
    }

    // ✅ VALIDATION: Max 3 variants
    if (variants.length > 3) {
      toast({
        title: "Validation Error",
        description: "You can add a maximum of 3 sizes only.",
        variant: "destructive",
      });
      return;
    }

    // ✅ FIXED: Don't send price or in_stock - triggers will compute them
    const newProduct = {
      title: title.trim(),
      description: description.trim(),
      // price will be auto-set by trigger
      category_id: categoryId,
      image_url: imageUrl,
      // in_stock will be auto-set by trigger
      customizable_fields: customizableFields,
      featured,
      catalog_number: catalogNumber.trim().toUpperCase(),
      gst_5pct,
      gst_18pct,
      created_at: new Date().toISOString(),
    };

    // Insert product
    const { data: prodData, error } = await supabase
      .from("products")
      .insert([newProduct])
      .select()
      .single();

    if (error) {
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // ✅ ENHANCED: Insert variants with all new fields
    const variantsToInsert = variants.map((v) => ({
      product_id: prodData.id,
      sku: v.sku.trim().toUpperCase(),
      size_display: v.size_display.trim(),
      size_numeric: v.size_numeric ? parseFloat(v.size_numeric) : null,
      size_unit: v.size_unit || "inch",
      price_tier: v.price_tier.trim().toUpperCase(),
      price: parseFloat(v.price),
      stock_quantity: Number(v.stock_quantity),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: variantErr } = await supabase
      .from("product_variants")
      .insert(variantsToInsert);

    if (variantErr) {
      // If variant insert fails, delete the product to maintain consistency
      await supabase.from("products").delete().eq("id", prodData.id);

      toast({
        title: "Failed to add product variants",
        description: variantErr.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Product added successfully",
      description:
        "Price and stock status have been automatically computed from variants.",
    });
    navigate("/admin/products");
  };

  return (
    <form
      onSubmit={validateAndSubmit}
      className="max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-md space-y-8"
      noValidate
    >
      <div className="border-b pb-4">
        <h2 className="text-3xl font-semibold text-gray-800">
          Add New Product
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Fill in the details below. Price and stock will be automatically
          calculated from variants.
        </p>
      </div>

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
          className="placeholder-gray-400"
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
          className="resize-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Catalog Number */}
      <div className="flex flex-col">
        <Label
          htmlFor="catalogNumber"
          className="mb-1 font-medium text-gray-700"
        >
          Catalog Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="catalogNumber"
          placeholder="e.g., SM-1614, MH-2401"
          value={catalogNumber}
          onChange={(e) => setCatalogNumber(e.target.value.toUpperCase())}
          required
          className="placeholder-gray-400 font-mono"
        />
        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Format: 2-4 letters, dash, 3-5 numbers. Used for SKU generation.
        </p>
      </div>

      {/* ✅ PREVIEW: Auto-Computed Price */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <Label className="text-sm font-semibold text-blue-900">
            Base Price (Auto-Computed Preview)
          </Label>
        </div>
        <div className="text-3xl font-bold text-blue-700">
          ₹{previewPrice.toFixed(2)}
        </div>
        <p className="text-xs text-blue-600 mt-1">
          Will be set to the minimum variant price automatically by database
          trigger
        </p>
      </div>

      {/* ✅ PREVIEW: Auto-Computed Stock Status */}
      <div
        className={`border rounded-lg p-4 ${
          previewStock
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Package
            className={`w-5 h-5 ${
              previewStock ? "text-green-600" : "text-red-600"
            }`}
          />
          <Label
            className={`text-sm font-semibold ${
              previewStock ? "text-green-900" : "text-red-900"
            }`}
          >
            Stock Status (Auto-Computed Preview)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              previewStock ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="font-medium text-lg">
            {previewStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>
        <p
          className={`text-xs mt-1 ${
            previewStock ? "text-green-600" : "text-red-600"
          }`}
        >
          Will be updated automatically by database trigger based on variant
          inventory
        </p>
      </div>

      {/* Category select */}
      <div className="flex flex-col">
        <Label htmlFor="category" className="mb-1 font-medium text-gray-700">
          Category <span className="text-red-500">*</span>
        </Label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          required
        >
          <option value="" disabled>
            -- Select a Category --
          </option>
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
        <div className="w-full max-w-xs">
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
              alt="Uploaded product"
              className="mt-4 w-32 h-32 object-cover rounded-md shadow-sm border"
            />
          )}
        </div>
      </div>

      {/* ✅ ENHANCED: Sizes & Variants with Full Fields */}
      <fieldset className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50/30">
        <legend className="text-xl font-semibold text-indigo-900 px-2">
          Sizes & Variants (max 3) <span className="text-red-500">*</span>
        </legend>
        <p className="text-sm text-gray-700 mb-6 bg-yellow-50 border border-yellow-200 rounded p-3">
          <Info className="w-4 h-4 inline mr-1" />
          <strong>Important:</strong> Product price will be automatically set to
          the <strong>lowest variant price</strong>. Stock status will be{" "}
          <strong>"In Stock"</strong> if ANY variant has stock &gt; 0.
        </p>

        {variants.map((variant, idx) => (
          <div
            key={idx}
            className="mb-6 border-2 border-gray-300 rounded-lg p-6 bg-white shadow-sm"
          >
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <span>
                Variant {idx + 1}{" "}
                <span className="text-sm font-normal text-gray-500">
                  (Tier: {variant.price_tier})
                </span>
              </span>
              {variants.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeVariant(idx)}
                  className="ml-auto"
                >
                  Remove
                </Button>
              )}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* SKU Display (Read-only, Auto-generated) */}
              <div className="lg:col-span-1">
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  SKU (Auto-Generated)
                </Label>
                <Input
                  value={variant.sku || "Enter catalog first"}
                  disabled
                  className="bg-gray-100 text-gray-700 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Format: {catalogNumber || "CATALOG"}-{variant.price_tier}
                </p>
              </div>

              {/* Size Display */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Size Display <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., 6 INCH, Small"
                  value={variant.size_display}
                  onChange={(e) =>
                    handleVariantChange(idx, "size_display", e.target.value)
                  }
                  required
                  className="placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Shown to customers
                </p>
              </div>

              {/* Price Tier */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Price Tier <span className="text-red-500">*</span>
                </Label>
                <select
                  value={variant.price_tier}
                  onChange={(e) =>
                    handleVariantChange(idx, "price_tier", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500"
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
                  <option value="SV">SV (Silver)</option>
                  <option value="BR">BR (Bronze)</option>
                </select>
                <p className="text-xs text-gray-500 mt-0.5">For SKU suffix</p>
              </div>

              {/* Size Numeric (Optional) */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Size (Number)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="6.0"
                  value={variant.size_numeric}
                  onChange={(e) =>
                    handleVariantChange(idx, "size_numeric", e.target.value)
                  }
                  className="placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  For range filtering
                </p>
              </div>

              {/* Size Unit */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Unit
                </Label>
                <select
                  value={variant.size_unit}
                  onChange={(e) =>
                    handleVariantChange(idx, "size_unit", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="inch">Inch</option>
                  <option value="cm">CM</option>
                  <option value="mm">MM</option>
                  <option value="unit">Unit (S/M/L)</option>
                  <option value="kg">KG</option>
                  <option value="gram">Gram</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Price (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="60.00"
                  value={variant.price}
                  onChange={(e) =>
                    handleVariantChange(idx, "price", e.target.value)
                  }
                  required
                  className="placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-0.5">Must be &gt; 0</p>
              </div>

              {/* Stock Quantity */}
              <div className="lg:col-span-3">
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Stock Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="100"
                  value={variant.stock_quantity}
                  onChange={(e) =>
                    handleVariantChange(idx, "stock_quantity", e.target.value)
                  }
                  required
                  className="placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Available units in inventory
                </p>
              </div>
            </div>
          </div>
        ))}

        {variants.length < 3 && (
          <Button
            type="button"
            onClick={addVariant}
            className="w-full mt-4"
            variant="outline"
          >
            + Add Another Size Variant
          </Button>
        )}

        {variants.length === 0 && (
          <p className="text-sm text-gray-600 mb-3 text-center bg-yellow-50 border border-yellow-200 rounded p-3">
            ⚠️ At least one size variant is required to enable the product.
          </p>
        )}
      </fieldset>

      {/* Featured */}
      <div className="flex items-center space-x-2">
        <input
          id="featured"
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          disabled={featuredCount >= 4 && !featured}
          className="h-5 w-5 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
        />
        <Label
          htmlFor="featured"
          className="font-medium text-gray-700 cursor-pointer select-none"
        >
          Featured (max 4){" "}
          {featuredCount >= 4 && !featured && (
            <span className="text-xs text-red-600 ml-2">Limit reached</span>
          )}
        </Label>
      </div>

      {/* Customizable Fields */}
      <fieldset className="border border-gray-300 rounded-md p-4 space-y-4">
        <legend className="text-lg font-semibold text-gray-700">
          Customization Options
        </legend>
        <div className="flex items-center space-x-2">
          <input
            id="custom-text-input"
            type="checkbox"
            checked={customizableFields.text_input}
            onChange={handleCustomizableFieldChange("text_input")}
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Label
            htmlFor="custom-text-input"
            className="font-medium text-gray-700 cursor-pointer"
          >
            Allow Custom Text Input
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="custom-image-upload"
            type="checkbox"
            checked={customizableFields.image_upload}
            onChange={handleCustomizableFieldChange("image_upload")}
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Label
            htmlFor="custom-image-upload"
            className="font-medium text-gray-700 cursor-pointer"
          >
            Allow Custom Image Upload
          </Label>
        </div>
      </fieldset>

      {/* GST Tax Rate */}
      <fieldset className="border border-gray-300 rounded-md p-4 space-y-4">
        <legend className="text-lg font-semibold text-gray-700 mb-4">
          GST Tax Rate
        </legend>
        <div className="flex items-center space-x-2">
          <input
            id="gst-5pct"
            type="checkbox"
            checked={gst_5pct || false}
            onChange={(e) => {
              setGst5pct(e.target.checked);
              if (e.target.checked) setGst18pct(false);
            }}
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Label
            htmlFor="gst-5pct"
            className="font-medium text-gray-700 cursor-pointer"
          >
            GST 5%
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="gst-18pct"
            type="checkbox"
            checked={gst_18pct || false}
            onChange={(e) => {
              setGst18pct(e.target.checked);
              if (e.target.checked) setGst5pct(false);
            }}
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Label
            htmlFor="gst-18pct"
            className="font-medium text-gray-700 cursor-pointer"
          >
            GST 18%
          </Label>
        </div>
      </fieldset>

      {/* Submit Button */}
      <div className="pt-6 border-t">
        <Button
          type="submit"
          className="w-full py-3 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-md shadow-md"
        >
          Add Product
        </Button>
        <p className="text-xs text-center text-gray-600 mt-3">
          ℹ️ Price and stock status will be computed automatically after saving
        </p>
      </div>
    </form>
  );
}
