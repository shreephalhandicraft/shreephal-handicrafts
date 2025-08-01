import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Upload, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const CustomizationOptions = ({
  product,
  customization,
  onCustomizationChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const getCustomizationOptions = (type) => {
    if (!product?.customizable_fields) return [];
    const fields = product.customizable_fields;
    const options = type === "color" ? fields.colors : fields.sizes;
    return Array.isArray(options) ? options : [];
  };

  // Check what customization options are available
  const hasTextInput = product?.customizable_fields?.text_input === true;
  const hasImageUpload = product?.customizable_fields?.image_upload === true;
  const colorOptions = getCustomizationOptions("color");
  const sizeOptions = getCustomizationOptions("size");

  // If no customization options are available, don't render the component
  if (
    !product?.is_customizable &&
    !hasTextInput &&
    !hasImageUpload &&
    colorOptions.length === 0 &&
    sizeOptions.length === 0
  ) {
    return null;
  }

  const getApiUrl = (endpoint) => {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    return `${backendUrl}${endpoint}`;
  };

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPG, PNG, and WebP files are allowed",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("productId", product.id);

      const response = await fetch(
        getApiUrl("/api/upload/customization-image"),
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        const imageData = {
          url: result.data.url,
          publicId: result.data.cloudinaryPublicId,
          fileName: file.name,
        };

        onCustomizationChange("uploadedImage", imageData);
        toast({
          title: "Success",
          description: "Customization image uploaded successfully",
        });
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = async () => {
    if (customization.uploadedImage?.publicId) {
      try {
        const response = await fetch(
          getApiUrl(
            `/api/upload/image/${customization.uploadedImage.publicId}`
          ),
          { method: "DELETE" }
        );

        if (response.ok) {
          toast({
            title: "Success",
            description: "Image removed successfully",
          });
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }

    onCustomizationChange("uploadedImage", null);
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
      <h3 className="font-semibold text-purple-900 text-lg flex items-center">
        <Palette className="h-5 w-5 mr-2" />
        Customize Your Product
      </h3>

      {/* Custom Text Input */}
      {hasTextInput && (
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
            value={customization.text || ""}
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
      {hasImageUpload && (
        <div>
          <Label
            htmlFor="imageUpload"
            className="text-sm font-medium text-purple-900"
          >
            Upload Custom Image (Optional)
          </Label>

          {!customization.uploadedImage ? (
            <div className="mt-3">
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("imageUpload")?.click()}
                disabled={uploading}
                className="w-full h-12 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? "Uploading..." : "Choose Image File"}
              </Button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="relative group">
                <img
                  src={customization.uploadedImage.url}
                  alt="Custom upload"
                  className="w-full h-48 object-cover rounded-lg border border-purple-200"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-purple-600">
                Selected: {customization.uploadedImage.fileName}
              </p>
            </div>
          )}

          <p className="text-xs text-purple-600 mt-1">
            Upload an image for printing, engraving, or custom design work
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomizationOptions;
