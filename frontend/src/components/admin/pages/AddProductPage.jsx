import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload.jsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export default function AddProductPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [customizableFields, setCustomizableFields] = useState({
    text_input: false,
    image_upload: false,
  });
  const [catalogNumber, setCatalogNumber] = useState("");
  // Variants (maximum 3)
  const [variants, setVariants] = useState([
    { size: "", price: "", stock_quantity: "" },
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

  const onUploadSuccess = (imgData) => {
    setImageUrl(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const handleVariantChange = (idx, field, value) => {
    setVariants((current) =>
      current.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const addVariant = () => {
    if (variants.length < 3) {
      setVariants([...variants, { size: "", price: "", stock_quantity: "" }]);
    }
  };

  const removeVariant = (idx) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== idx));
    }
  };

  const handleCustomizableFieldChange = (field) => (e) => {
    setCustomizableFields((prev) => ({ ...prev, [field]: e.target.checked }));
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
          "Maximum 4 featured products allowed. Unfeature one before adding.",
        variant: "destructive",
      });
      return;
    }

    // Validate variants
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
        description:
          "Each variant must have size, price (>0), and stock quantity (>=0).",
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

    // Insert main product
    const newProduct = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category_id: categoryId,
      image_url: imageUrl,
      in_stock: inStock,
      customizable_fields: customizableFields,
      featured,
      catalog_number: catalogNumber.trim(),
      created_at: new Date().toISOString(),
    };
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

    // Insert variants (sizes) to product_variants table
    const variantsToInsert = variants.map((v) => ({
      product_id: prodData.id,
      size_code: v.size,
      price: parseFloat(v.price),
      stock_quantity: Number(v.stock_quantity),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    const { error: variantErr } = await supabase
      .from("product_variants")
      .insert(variantsToInsert);

    if (variantErr) {
      toast({
        title: "Failed to add product variants",
        description: variantErr.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Product added successfully" });
    navigate("/admin/products");
  };

  return (
    <form
      onSubmit={validateAndSubmit}
      className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-md space-y-8"
      noValidate
    >
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">
        Add New Product
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

      {/* Base Price */}
      <div className="flex flex-col">
        <Label htmlFor="price" className="mb-1 font-medium text-gray-700">
          Base Price (₹) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Enter base price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="placeholder-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1">
          This is the default price if no variants.
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
              alt="Uploaded product"
              className="mt-4 w-32 h-32 object-cover rounded-md shadow-sm border"
            />
          )}
        </div>
      </div>

      {/* Sizes & Variants */}
      <fieldset className="border border-gray-300 rounded-md p-4">
        <legend className="text-lg font-semibold text-gray-700 mb-4">
          Sizes & Variants (max 3)
        </legend>
        {variants.map((variant, idx) => (
          <div
            key={idx}
            className="mb-4 flex flex-wrap gap-4 items-end border p-4 rounded-md shadow-sm"
          >
            <div className="flex-1 min-w-[6rem]">
              <Label
                htmlFor={`size-${idx}`}
                className="block mb-1 font-medium text-gray-600"
              >
                Size <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`size-${idx}`}
                placeholder="e.g. 6, 6.5, 7"
                value={variant.size}
                onChange={(e) =>
                  handleVariantChange(idx, "size", e.target.value)
                }
                required
                className="placeholder-gray-400"
              />
            </div>

            <div className="flex-1 min-w-[8rem]">
              <Label
                htmlFor={`price-${idx}`}
                className="block mb-1 font-medium text-gray-600"
              >
                Price (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`price-${idx}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="Price for size"
                value={variant.price}
                onChange={(e) =>
                  handleVariantChange(idx, "price", e.target.value)
                }
                required
                className="placeholder-gray-400"
              />
            </div>

            <div className="flex-1 min-w-[10rem]">
              <Label
                htmlFor={`stock-${idx}`}
                className="block mb-1 font-medium text-gray-600"
              >
                Stock Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`stock-${idx}`}
                type="number"
                min="0"
                step="1"
                placeholder="Stock qty"
                value={variant.stock_quantity}
                onChange={(e) =>
                  handleVariantChange(idx, "stock_quantity", e.target.value)
                }
                required
                className="placeholder-gray-400"
              />
            </div>

            {variants.length > 1 && (
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="destructive"
                  className="h-10 px-3 py-2"
                  onClick={() => removeVariant(idx)}
                  aria-label={`Remove variant ${idx + 1}`}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        ))}

        {variants.length < 3 && (
          <Button
            type="button"
            onClick={addVariant}
            className="mt-2 w-full sm:w-auto"
            variant="outline"
          >
            Add Size
          </Button>
        )}
      </fieldset>

      {/* In Stock */}
      <div className="flex items-center space-x-2">
        <input
          id="inStock"
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <Label
          htmlFor="inStock"
          className="font-medium text-gray-700 cursor-pointer"
        >
          In Stock
        </Label>
      </div>

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
          Featured (max 4)
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

      {/* Catalog Number */}
      <div className="flex flex-col">
        <Label
          htmlFor="catalogNumber"
          className="mb-1 font-medium text-gray-700"
        >
          Catalog Number (optional)
        </Label>
        <Input
          id="catalogNumber"
          placeholder="Enter catalog number"
          value={catalogNumber}
          onChange={(e) => setCatalogNumber(e.target.value)}
          className="placeholder-gray-400"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full py-3 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-md shadow-md"
      >
        Add Product
      </Button>
    </form>
  );
}
