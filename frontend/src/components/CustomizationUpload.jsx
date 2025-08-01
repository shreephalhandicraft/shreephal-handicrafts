import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, Loader2 } from "lucide-react";

const CustomizationUpload = ({ orderId, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const { toast } = useToast();

  // File validation
  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB for customization files
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only images (JPG, PNG, WebP) and PDF files are allowed",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFile(file)) {
      event.target.value = ""; // Clear the input
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (orderId) {
        formData.append("orderId", orderId);
      }

      const response = await fetch("/api/upload/customization", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setUploadedFile({
          ...result.data,
          fileName: file.name,
          fileType: file.type,
        });

        onUploadSuccess?.(result.data);
        toast({
          title: "Success",
          description: "Customization file uploaded successfully",
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload customization file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = "";
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    toast({
      title: "Success",
      description: "File removed",
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          disabled={uploading || uploadedFile}
          className="hidden"
          id="customization-upload"
        />
        <label
          htmlFor="customization-upload"
          className={`cursor-pointer block text-center ${
            uploading || uploadedFile ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-500" />
              <span>Uploading...</span>
            </div>
          ) : uploadedFile ? (
            <div className="flex items-center justify-center">
              <File className="h-6 w-6 mr-2 text-green-500" />
              <span className="text-green-600">File uploaded</span>
            </div>
          ) : (
            <div>
              <File className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-700">
                Upload Customization File
              </p>
              <p className="text-sm text-gray-500">Images or PDF (max 10MB)</p>
            </div>
          )}
        </label>
      </div>

      {/* Display uploaded file */}
      {uploadedFile && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center">
            <File className="h-5 w-5 mr-2 text-gray-500" />
            <div>
              <p className="text-sm font-medium">{uploadedFile.fileName}</p>
              <p className="text-xs text-gray-500">
                {uploadedFile.fileType?.includes("pdf")
                  ? "PDF Document"
                  : "Image File"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={removeFile}
            className="text-red-600 hover:text-red-700"
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomizationUpload;
