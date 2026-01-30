import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUploadDirect from "@/components/ImageUploadDirect.jsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Star } from "lucide-react";

// Helper function to generate slug from name
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

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
  const [rating, setRating] = useState("0");
  const [featured, setFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const onUploadSuccess = (imgData) => {
    setImage(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    // Auto-generate slug from name
    const autoSlug = generateSlug(newName);
    setSlug(autoSlug);
  };

  const handleSlugChange = (e) => {
    // Allow manual override but sanitize
    const sanitized = generateSlug(e.target.value);
    setSlug(sanitized);
  };

  // Check if slug already exists
  const checkSlugExists = async (slugToCheck) => {
    if (!slugToCheck) return false;
    
    const { data, error } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slugToCheck)
      .limit(1);
    
    if (error) {
      console.error("Error checking slug:", error);
      return false;
    }
    
    return data && data.length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and Slug are required.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate slug
    setIsCheckingSlug(true);
    const slugExists = await checkSlugExists(slug);
    setIsCheckingSlug(false);

    if (slugExists) {
      toast({
        title: "Duplicate Slug",
        description: "This slug already exists. Please use a different one.",
        variant: "destructive",
      });
      return;
    }

    const categoryData = {
      name: name.trim(),
      slug: slug.trim(),
      price: price ? parseFloat(price) : null,
      image: imageUrl || null,
      rating: parseFloat(rating),
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
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={handleNameChange}
            placeholder="Category name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={handleSlugChange}
            placeholder="category-slug"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Auto-generated from name. You can edit manually.
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
          <Label htmlFor="rating">Rating</Label>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < parseFloat(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured"
            checked={featured}
            onCheckedChange={setFeatured}
          />
          <Label htmlFor="featured" className="cursor-pointer">
            Feature this category
          </Label>
        </div>
        
        <div>
          <Label>Category Image</Label>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Category preview"
              className="w-24 h-24 object-cover rounded-md border border-gray-300 mb-2"
            />
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
          <Button type="submit" disabled={uploading || isCheckingSlug}>
            {isCheckingSlug ? "Checking..." : "Create Category"}
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
  const [price, setPrice] = useState(category?.price?.toString() || "");
  const [rating, setRating] = useState(category?.rating?.toString() || "0");
  const [featured, setFeatured] = useState(category?.featured || false);
  const [imageUrl, setImageUrl] = useState(category?.image || "");
  const [uploading, setUploading] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setSlug(category.slug || "");
      setPrice(category.price?.toString() || "");
      setRating(category.rating?.toString() || "0");
      setFeatured(category.featured || false);
      setImageUrl(category.image || "");
    }
  }, [category]);

  const onUploadSuccess = (imgData) => {
    setImage(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    // Auto-generate slug from name (only if slug wasn't manually edited)
    if (slug === generateSlug(name)) {
      const autoSlug = generateSlug(newName);
      setSlug(autoSlug);
    }
  };

  const handleSlugChange = (e) => {
    const sanitized = generateSlug(e.target.value);
    setSlug(sanitized);
  };

  // Check if slug already exists (excluding current category)
  const checkSlugExists = async (slugToCheck) => {
    if (!slugToCheck) return false;
    
    const { data, error } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slugToCheck)
      .neq("id", category.id) // Exclude current category
      .limit(1);
    
    if (error) {
      console.error("Error checking slug:", error);
      return false;
    }
    
    return data && data.length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and Slug are required.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate slug only if it changed
    if (slug !== category.slug) {
      setIsCheckingSlug(true);
      const slugExists = await checkSlugExists(slug);
      setIsCheckingSlug(false);

      if (slugExists) {
        toast({
          title: "Duplicate Slug",
          description: "This slug already exists. Please use a different one.",
          variant: "destructive",
        });
        return;
      }
    }

    const categoryData = {
      name: name.trim(),
      slug: slug.trim(),
      price: price ? parseFloat(price) : null,
      image: imageUrl || null,
      rating: parseFloat(rating),
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
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={handleNameChange}
            placeholder="Category name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={handleSlugChange}
            placeholder="category-slug"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            URL-friendly identifier for this category
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
          <Label htmlFor="featured" className="cursor-pointer">
            Featured Category
          </Label>
        </div>

        <div>
          <Label htmlFor="rating">Rating</Label>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < parseFloat(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured"
            checked={featured}
            onCheckedChange={setFeatured}
          />
          <Label htmlFor="featured" className="cursor-pointer">
            Feature this category
          </Label>
        </div>

        <div>
          <Label>Category Image</Label>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-24 h-24 object-cover rounded-md border border-gray-300 mb-2"
            />
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
          <Button type="submit" disabled={uploading || isCheckingSlug}>
            {isCheckingSlug ? "Checking..." : "Update Category"}
          </Button>
        </div>
      </form>
    </div>
  );
}
