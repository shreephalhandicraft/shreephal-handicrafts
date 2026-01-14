# 🖼️ Cloudinary Architecture Guide

## 📁 Folder Structure

All media is organized in a structured hierarchy:

```
shreephal-handicrafts/
├── products/
│   ├── {category-slug}/
│   │   ├── {catalog-number}_main.jpg
│   │   ├── {catalog-number}_01.jpg
│   │   ├── {catalog-number}_02.jpg
│   │   └── ...
├── categories/
│   ├── {category-slug}.jpg
│   └── ...
├── banners/
│   ├── hero_main.jpg
│   ├── promo_01.jpg
│   └── ...
├── customizations/
│   └── orders/
│       ├── {order-id}/
│       │   ├── {timestamp}_design.jpg
│       │   └── ...
└── temp/
    └── {session-id}_{filename}
```

---

## 🚀 Usage Examples

### **1. Upload Product Images (Admin Panel)**

```jsx
import ImageUploadStructured from '@/components/ImageUploadStructured';

const ProductImageUpload = ({ product, category }) => {
  const handleUploadSuccess = (images) => {
    console.log('Uploaded:', images);
    // Save images to database
  };

  return (
    <ImageUploadStructured
      categorySlug={category.slug} // e.g., "decorative-plates"
      identifier={product.catalog_number} // e.g., "CAT001"
      maxFiles={5}
      onUploadSuccess={handleUploadSuccess}
    />
  );
};

// Results in Cloudinary:
// shreephal-handicrafts/products/decorative-plates/CAT001_main.jpg
// shreephal-handicrafts/products/decorative-plates/CAT001_01.jpg
// shreephal-handicrafts/products/decorative-plates/CAT001_02.jpg
```

---

### **2. Upload Category Image**

```jsx
import ImageUploadStructured from '@/components/ImageUploadStructured';
import { CloudinaryFolders } from '@/utils/cloudinaryUpload';

const CategoryImageUpload = ({ category }) => {
  return (
    <ImageUploadStructured
      folder={CloudinaryFolders.CATEGORIES}
      identifier={category.slug} // e.g., "wall-art"
      maxFiles={1}
      onUploadSuccess={(image) => {
        // Save to categories table
      }}
    />
  );
};

// Results in: shreephal-handicrafts/categories/wall-art.jpg
```

---

### **3. Upload Customization Files (Customer Orders)**

```jsx
import ImageUploadStructured from '@/components/ImageUploadStructured';

const CustomizationUpload = ({ orderId }) => {
  return (
    <ImageUploadStructured
      orderId={orderId} // Automatically uses customizations folder
      identifier="design"
      maxFiles={3}
      onUploadSuccess={(files) => {
        // Save to customization_files table
      }}
    />
  );
};

// Results in: shreephal-handicrafts/customizations/orders/{order-id}/design_main.jpg
```

---

### **4. Display Optimized Images (Frontend)**

```jsx
import OptimizedImage from '@/components/OptimizedImage';

// Product Card - Thumbnail
<OptimizedImage 
  src={product.image_url}
  alt={product.title}
  preset="THUMBNAIL"
  className="w-full h-32 rounded-lg"
/>

// Product Detail - Large
<OptimizedImage 
  src={product.image_url}
  alt={product.title}
  preset="DETAIL"
  className="w-full h-96 rounded-lg"
/>

// Hero Banner
<OptimizedImage 
  src={banner.image_url}
  alt="Hero Banner"
  preset="HERO"
  className="w-full h-screen object-cover"
/>
```

---

### **5. Manual URL Generation**

```jsx
import { getOptimizedImageUrl, ImagePresets } from '@/utils/cloudinaryUpload';

// Get optimized URL
const thumbnailUrl = getOptimizedImageUrl(
  product.image_url, 
  ImagePresets.THUMBNAIL
);

const cardUrl = getOptimizedImageUrl(
  product.image_url, 
  ImagePresets.CARD
);

// Custom transformation
const customUrl = getOptimizedImageUrl(product.image_url, {
  width: 500,
  height: 500,
  quality: 'auto:best',
  crop: 'fill'
});
```

---

## 🎨 Image Presets

| Preset | Width | Height | Quality | Use Case |
|--------|-------|--------|---------|----------|
| `THUMBNAIL` | 200px | 200px | auto:low | Cart items, thumbnails |
| `CARD` | 400px | 400px | auto:good | Product cards, listings |
| `DETAIL` | 800px | 800px | auto:best | Product detail pages |
| `HERO` | 1200px | 600px | auto:best | Hero banners |
| `BANNER` | 1920px | 600px | auto:best | Full-width banners |

---

## 🔧 Available Utilities

### **From `cloudinaryUpload.js`:**

```jsx
import {
  CloudinaryFolders,        // Predefined folder paths
  ImagePresets,             // Transformation presets
  uploadToCloudinary,       // Single file upload
  uploadMultipleToCloudinary, // Multi-file upload
  getOptimizedImageUrl,     // Generate optimized URLs
  deleteFromCloudinary,     // Delete images
  getProductImageFolder,    // Helper for product paths
  getCustomizationFolder    // Helper for customization paths
} from '@/utils/cloudinaryUpload';
```

---

## ✅ Benefits

1. **Organized Media**: Easy to find and manage images
2. **Consistent Naming**: Predictable file names
3. **Auto-Optimization**: WebP, lazy loading, responsive
4. **CDN Performance**: Fast delivery worldwide
5. **Easy Cleanup**: Delete entire folders when needed
6. **Audit Trail**: Know which images belong where

---

## 🚨 Migration Notes

### **Existing Images (Backward Compatible)**

- ✅ Old images continue working
- ✅ `OptimizedImage` handles both old and new formats
- ✅ New uploads use structured folders automatically
- ⚠️ Gradually migrate old images when editing products

### **How to Migrate Old Images:**

1. Open product in admin panel
2. Re-upload images using `ImageUploadStructured`
3. Old images stay as fallback
4. System automatically uses new structured URLs

---

## 📊 Database Schema Updates

No changes needed! Works with existing columns:
- `products.image_url`
- `product_images.cloudinary_url`
- `categories.image`
- `customization_files.file_url`

---

## 🎯 Next Steps

1. ✅ Files created (you're done!)
2. Update admin panel to use `ImageUploadStructured`
3. Replace `<img>` tags with `<OptimizedImage>` in frontend
4. Test uploads in development
5. Deploy to production

---

## 🆘 Support

**Common Issues:**

**Q: Images not uploading?**  
A: Check `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_BACKEND_URL` in `.env`

**Q: Old images broken?**  
A: They should work! `OptimizedImage` handles fallbacks.

**Q: How to delete old unorganized images?**  
A: Use Cloudinary dashboard → Browse → Select folder → Delete

---

**Documentation Generated:** 2026-01-14  
**Version:** 1.0.0
