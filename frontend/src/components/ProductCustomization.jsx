// components/ProductCustomization.jsx
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Palette, Upload } from "lucide-react";

const ProductCustomization = ({
  product,
  customization,
  onCustomizationChange,
}) => {
  const customizableFields = product.customizable_fields || {};
  const colorOptions = Array.isArray(customizableFields.colors)
    ? customizableFields.colors
    : [];
  const sizeOptions = Array.isArray(customizableFields.sizes)
    ? customizableFields.sizes
    : [];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onCustomizationChange("uploadedImage", file);
    }
  };

  if (
    !product.is_customizable &&
    colorOptions.length === 0 &&
    sizeOptions.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
      <h3 className="font-semibold text-purple-900 text-lg flex items-center">
        <Palette className="h-5 w-5 mr-2" />
        Customize Your Product
      </h3>

      {/* Custom Text */}
      {product.is_customizable && (
        <div>
          <Label
            htmlFor="customText"
            className="text-sm font-medium text-purple-900"
          >
            Custom Text (Optional)
          </Label>
          <Textarea
            id="customText"
            placeholder="Enter text for engraving or personalization..."
            value={customization.text}
            onChange={(e) => onCustomizationChange("text", e.target.value)}
            className="mt-2 resize-none border-purple-200 focus:border-purple-400"
            rows={3}
          />
          <p className="text-xs text-purple-600 mt-1">
            Add custom text for engraving, embossing, or printing on your
            product
          </p>
        </div>
      )}

      {/* Color Options */}
      {colorOptions.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-purple-900">
            Color Options
          </Label>
          <div className="flex gap-3 mt-3 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => onCustomizationChange("color", color)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                  customization.color === color
                    ? "border-purple-600 bg-purple-600 text-white shadow-lg"
                    : "border-purple-300 bg-white text-purple-700 hover:border-purple-500 hover:shadow-md"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Options */}
      {sizeOptions.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-purple-900">
            Customization Size Options
          </Label>
          <div className="flex gap-3 mt-3 flex-wrap">
            {sizeOptions.map((size) => (
              <button
                key={size}
                onClick={() => onCustomizationChange("size", size)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                  customization.size === size
                    ? "border-purple-600 bg-purple-600 text-white shadow-lg"
                    : "border-purple-300 bg-white text-purple-700 hover:border-purple-500 hover:shadow-md"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <p className="text-xs text-purple-600 mt-2">
            Note: This is different from product size variants and relates to
            customization options
          </p>
        </div>
      )}

      {/* Image Upload */}
      {product.is_customizable && (
        <div>
          <Label
            htmlFor="imageUpload"
            className="text-sm font-medium text-purple-900"
          >
            Upload Custom Image (Optional)
          </Label>
          <div className="mt-3">
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("imageUpload")?.click()}
              className="w-full h-12 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              {customization.uploadedImage
                ? customization.uploadedImage.fileName
                : "Choose Image File"}
            </Button>
            {customization.uploadedImage && (
              <p className="text-xs text-purple-600 mt-2">
                Selected: {customization.uploadedImage.fileName}
              </p>
            )}
          </div>
          <p className="text-xs text-purple-600 mt-1">
            Upload an image for printing, engraving, or custom design work
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductCustomization;
