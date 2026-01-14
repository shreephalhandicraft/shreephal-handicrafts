/**
 * Direct Cloudinary Upload Component
 * Uploads directly to Cloudinary without backend server
 * Uses unsigned upload preset
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';

const ImageUploadDirect = ({ 
  onUploadSuccess, 
  maxFiles = 1, 
  accept = 'image/*',
  folder = 'shreephal-handicrafts/products' // Default folder
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const { toast } = useToast();

  // Get Cloudinary config from environment
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dqs347ixj';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'shreephal_unsigned';

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

  /**
   * Upload directly to Cloudinary using unsigned upload
   */
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    
    // Direct upload to Cloudinary API
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    return response.json();
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
      const uploadPromises = files.map(file => uploadToCloudinary(file));
      const results = await Promise.all(uploadPromises);
      
      // Transform results to match expected format
      const uploadedData = results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        cloudinaryPublicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        fileId: result.public_id // For compatibility
      }));

      setUploadedImages(prev => [...prev, ...uploadedData]);
      
      // Return single object for single file, array for multiple
      const returnData = maxFiles === 1 ? uploadedData[0] : uploadedData;
      onUploadSuccess?.(returnData);

      toast({
        title: 'Success',
        description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully`
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

  /**
   * Delete image from Cloudinary using destroy API
   */
  const removeImage = async (publicId) => {
    try {
      // Note: Deletion requires backend or signed request
      // For now, just remove from UI
      setUploadedImages(prev => 
        prev.filter(img => img.publicId !== publicId)
      );

      toast({
        title: 'Success',
        description: 'Image removed from list'
      });

      // TODO: Implement actual deletion via backend or signed request
      console.warn('Image removed from UI only. Implement backend deletion for cleanup.');
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove image',
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
          id="direct-image-upload"
        />
        <label
          htmlFor="direct-image-upload"
          className={`cursor-pointer block ${
            uploading || uploadedImages.length >= maxFiles
              ? 'pointer-events-none opacity-50'
              : ''
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mr-2 text-blue-500" />
              <span className="text-gray-600">Uploading directly to Cloudinary...</span>
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
                ☁️ Direct upload to Cloudinary
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
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                ✅ Uploaded
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {uploadedImages.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Images uploaded to: {folder}
        </p>
      )}
    </div>
  );
};

export default ImageUploadDirect;
