// Updated ImageUpload component - key changes marked with comments
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";

const ImageUpload = ({ onUploadSuccess, maxFiles = 1, accept = "image/*" }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const { toast } = useToast();

  // ✅ SIMPLEST: Always use the backend URL from environment
  const getApiUrl = (endpoint) => {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      "http://localhost:3000"; // Fallback to localhost if not set
    return `${backendUrl}${endpoint}`;
  };

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024;
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

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      if (!validateFile(file)) return;
    }

    if (files.length > maxFiles) {
      toast({
        title: "Error",
        description: `Maximum ${maxFiles} file${
          maxFiles > 1 ? "s" : ""
        } allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();

      if (maxFiles === 1) {
        formData.append("image", files[0]);

        // ✅ FIXED: Use production-safe URL
        const response = await fetch(getApiUrl("/api/upload/image"), {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          // ✅ FIXED: Map backend response to frontend expectations
          const imageData = {
            ...result.data,
            fileId: result.data.cloudinaryPublicId, // Use cloudinaryPublicId as fileId
            public_id: result.data.cloudinaryPublicId,
            // No variations in backend, so use main URL
          };

          setUploadedImages([imageData]);
          onUploadSuccess?.(imageData);
          toast({
            title: "Success",
            description: "Image uploaded successfully",
          });
        } else {
          throw new Error(result.message || "Upload failed");
        }
      } else {
        files.forEach((file) => formData.append("images", file));

        // ✅ FIXED: Use production-safe URL
        const response = await fetch(getApiUrl("/api/upload/images"), {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          // ✅ FIXED: Map backend response correctly
          const imagesData = result.data.map((item) => ({
            ...item,
            fileId: item.cloudinaryPublicId, // Use cloudinaryPublicId as fileId
            public_id: item.cloudinaryPublicId,
          }));

          setUploadedImages(imagesData);
          onUploadSuccess?.(imagesData);
          toast({
            title: "Success",
            description: `${result.data.length} images uploaded successfully`,
          });
        } else {
          throw new Error(result.message || "Upload failed");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image(s)",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // ✅ FIXED: Use correct delete endpoint that matches your backend
  const removeImage = async (publicId) => {
    try {
      // Use the actual backend endpoint with publicId
      const response = await fetch(getApiUrl(`/api/upload/image/${publicId}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setUploadedImages((prev) =>
          prev.filter((img) => img.fileId !== publicId)
        );

        toast({
          title: "Success",
          description: "Image removed successfully",
        });
      } else {
        throw new Error(result.message || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleFileUpload}
          disabled={uploading || uploadedImages.length >= maxFiles}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer block ${
            uploading || uploadedImages.length >= maxFiles
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mr-2 text-blue-500" />
              <span className="text-gray-600">Uploading...</span>
            </div>
          ) : uploadedImages.length >= maxFiles ? (
            <div className="flex items-center justify-center">
              <AlertCircle className="h-8 w-8 mr-2 text-yellow-500" />
              <span className="text-gray-600">Maximum files reached</span>
            </div>
          ) : (
            <div>
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">
                Click to upload {maxFiles > 1 ? "images" : "image"}
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, WebP up to 5MB{" "}
                {maxFiles > 1 ? `(max ${maxFiles} files)` : ""}
              </p>
            </div>
          )}
        </label>
      </div>

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedImages.map((image, index) => (
            <div key={image.fileId || index} className="relative group">
              <img
                src={image.url} // ✅ FIXED: Use direct URL from backend
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border shadow-sm"
              />
              <button
                onClick={() => removeImage(image.fileId)} // This is now cloudinaryPublicId
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
