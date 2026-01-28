import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUploadDirect from "@/components/ImageUploadDirect.jsx";
import { useToast } from "@/hooks/use-toast";

// Helper function to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

// Custom Checkbox Component (no Radix UI dependency)
function CustomCheckbox({ id, checked, onCheckedChange, className = "" }) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer ${className}`}
    />
  );
}

// --- AddCategoryForm ---
export function AddCategoryForm({ onSubmit, onCancel }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState("");
  const [featured, setFeatured] = useState(false);
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  const onUploadSuccess = (imgData) => {
    setImage(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName || !trimmedSlug) {
      toast({
        title: "Validation Error",
        description: "Name and Slug are required.",
        variant: "destructive",
      });
      return;
    }

    // Build data object matching database schema
    const categoryData = {
      name: trimmedName,
      slug: trimmedSlug,
      image: image || null,
      price: price ? parseFloat(price) : null,
      rating: rating ? parseFloat(rating) : null,
      featured: featured,
    };

    onSubmit(categoryData);
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add New Category</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Wood Crafts"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="slug">
            Slug <span className="text-red-500">*</span>
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            placeholder="wood-crafts"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Auto-generated from name. Used in URLs.
          </p>
        </div>
        
        <div>
          <Label htmlFor="price">Price (Optional)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        
        <div>
          <Label htmlFor="rating">Rating (Optional)</Label>
          <Input
            id="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="4.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Rating out of 5 (e.g., 4.5)
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <CustomCheckbox
            id="featured"
            checked={featured}
            onCheckedChange={setFeatured}
          />
          <Label htmlFor="featured" className="cursor-pointer">
            Featured Category
          </Label>
        </div>
        
        <div>
          <Label>Category Image</Label>
          {image && (
            <div className="mb-2">
              <img
                src={image}
                alt="Category preview"
                className="w-24 h-24 object-cover rounded border"
              />
            </div>
          )}
          <ImageUploadDirect
            onUploadSuccess={onUploadSuccess}
            onUploadStart={handleUploadStart}
            maxFiles={1}
            folder="shreephal-handicrafts/categories"
          />
          {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading image...</p>}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            Create Category
          </Button>
        </div>
      </form>
    </div>
  );
}

// --- EditCategoryForm ---
export function EditCategoryForm({ category, onSubmit, onCancel }) {
  const { toast } = useToast();
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [price, setPrice] = useState(category?.price || "");
  const [rating, setRating] = useState(category?.rating || "");
  const [featured, setFeatured] = useState(category?.featured || false);
  const [image, setImage] = useState(category?.image || "");
  const [uploading, setUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setSlug(category.slug || "");
      setPrice(category.price || "");
      setRating(category.rating || "");
      setFeatured(category.featured || false);
      setImage(category.image || "");
    }
  }, [category]);

  const onUploadSuccess = (imgData) => {
    setImage(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName || !trimmedSlug) {
      toast({
        title: "Validation Error",
        description: "Name and Slug are required.",
        variant: "destructive",
      });
      return;
    }

    // Build data object matching database schema
    const categoryData = {
      name: trimmedName,
      slug: trimmedSlug,
      image: image || null,
      price: price ? parseFloat(price) : null,
      rating: rating ? parseFloat(rating) : null,
      featured: featured,
    };

    onSubmit(categoryData);
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit Category</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Wood Crafts"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="slug">
            Slug <span className="text-red-500">*</span>
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            placeholder="wood-crafts"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Used in URLs. Change carefully.
          </p>
        </div>
        
        <div>
          <Label htmlFor="price">Price (Optional)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        
        <div>
          <Label htmlFor="rating">Rating (Optional)</Label>
          <Input
            id="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="4.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Rating out of 5 (e.g., 4.5)
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <CustomCheckbox
            id="featured"
            checked={featured}
            onCheckedChange={setFeatured}
          />
          <Label htmlFor="featured" className="cursor-pointer">
            Featured Category
          </Label>
        </div>
        
        <div>
          <Label>Category Image</Label>
          {image ? (
            <div className="mb-2">
              <img
                src={image}
                alt={name}
                className="w-24 h-24 object-cover rounded border"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-2">No image uploaded yet</p>
          )}
          <ImageUploadDirect
            onUploadSuccess={onUploadSuccess}
            onUploadStart={handleUploadStart}
            maxFiles={1}
            folder="shreephal-handicrafts/categories"
          />
          {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading image...</p>}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            Update Category
          </Button>
        </div>
      </form>
    </div>
  );
}
