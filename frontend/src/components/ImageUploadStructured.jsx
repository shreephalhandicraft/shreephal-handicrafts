/**
 * Structured ImageUpload Component
 * Enforces Cloudinary folder structure and naming conventions
 * Use this for admin panels to maintain organized media
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { 
  uploadToCloudinary, 
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  CloudinaryFolders,
  getProductImageFolder,
  getCustomizationFolder
} from '@/utils/cloudinaryUpload';

const ImageUploadStructured = ({ 
  onUploadSuccess, 
  folder = CloudinaryFolders.TEMP,
  identifier = Date.now().toString(), // Default to timestamp if not provided
  maxFiles = 1, 
  accept = 'image/*',
  categorySlug = null, // For products: auto-constructs folder path
  orderId = null // For customizations: auto-constructs folder path
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const { toast } = useToast();

  // Auto-determine folder based on context
  const getUploadFolder = () => {
    if (categorySlug) {
      return getProductImageFolder(categorySlug);
    }
    if (orderId) {
      return getCustomizationFolder(orderId);
    }
    return folder;
  };

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive'
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Only JPG, PNG, and WebP files are allowed',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate all files
    for (const file of files) {
      if (!validateFile(file)) return;
    }

    if (files.length > maxFiles) {
      toast({
        title: 'Error',
        description: `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`,
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const uploadFolder = getUploadFolder();
      let uploadedData;

      if (maxFiles === 1) {
        // Single file upload
        uploadedData = await uploadToCloudinary(
          files[0],
          uploadFolder,
          identifier,
          'main'
        );
        setUploadedImages([uploadedData]);
        onUploadSuccess?.(uploadedData);
      } else {
        // Multiple files upload
        uploadedData = await uploadMultipleToCloudinary(
          files,
          uploadFolder,
          identifier
        );
        setUploadedImages(uploadedData);
        onUploadSuccess?.(uploadedData);
      }

      toast({
        title: 'Success',
        description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image(s)',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = async (publicId) => {
    try {
      await deleteFromCloudinary(publicId);
      
      setUploadedImages(prev => 
        prev.filter(img => img.publicId !== publicId)
      );

      toast({
        title: 'Success',
        description: 'Image removed successfully'
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove image',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleFileUpload}
          disabled={uploading || uploadedImages.length >= maxFiles}
          className="hidden"
          id="structured-image-upload"
        />
        <label
          htmlFor="structured-image-upload"
          className={`cursor-pointer block ${
            uploading || uploadedImages.length >= maxFiles
              ? 'pointer-events-none opacity-50'
              : ''
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mr-2 text-blue-500" />
              <span className="text-gray-600">Uploading to organized folder...</span>
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
                Click to upload {maxFiles > 1 ? 'images' : 'image'}
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, WebP up to 5MB
                {maxFiles > 1 ? ` (max ${maxFiles} files)` : ''}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                📁 Folder: {getUploadFolder()}
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Preview Grid */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedImages.map((image, index) => (
            <div key={image.publicId || index} className="relative group">
              <img
                src={image.url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border shadow-sm"
              />
              <button
                onClick={() => removeImage(image.publicId)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                {image.publicId?.split('/').pop()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadStructured;
