import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUpload from "@/components/ImageUpload.jsx";
import { useToast } from "@/hooks/use-toast";

// --- AddCategoryForm ---
export function AddCategoryForm({ onSubmit, onCancel }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const onUploadSuccess = (imgData) => {
    setImageUrl(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && slug.trim()) {
      onSubmit({ name, slug, price, image: imageUrl }); // Fixed: use imageUrl
    } else {
      toast({
        title: "Validation Error",
        description: "Name and Slug are required.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add New Category</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="category-slug"
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
          />
        </div>
        <div>
          <Label>Image</Label>
          {imageUrl && ( // Fixed: use imageUrl
            <img
              src={imageUrl} // Fixed: use imageUrl
              alt="Category image"
              style={{
                width: 100,
                height: 100,
                objectFit: "cover",
                borderRadius: 6,
                border: "1px solid #ccc",
                marginBottom: 8,
              }}
            />
          )}
          <ImageUpload
            onUploadStart={handleUploadStart}
            onUploadSuccess={onUploadSuccess}
            maxFiles={1}
            accept="image/*"
          />
          {uploading && <p>Uploading image...</p>}
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            Create
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
  const [imageUrl, setImageUrl] = useState(category?.image || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setSlug(category.slug || "");
      setPrice(category.price || "");
      setImageUrl(category.image || "");
    }
  }, [category]);

  const onUploadSuccess = (imgData) => {
    setImageUrl(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && slug.trim()) {
      onSubmit({ name, slug, price, image: imageUrl }); // Fixed: use imageUrl
    } else {
      toast({
        title: "Validation Error",
        description: "Name and Slug are required.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit Category</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="category-slug"
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
          />
        </div>
        <div>
          <Label>Current Image</Label>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              style={{
                width: 100,
                height: 100,
                objectFit: "cover",
                borderRadius: 6,
                border: "1px solid #ccc",
                marginBottom: 8,
              }}
            />
          ) : (
            <p>No image uploaded yet</p>
          )}
          <ImageUpload
            onUploadStart={handleUploadStart}
            onUploadSuccess={onUploadSuccess}
            maxFiles={1}
            accept="image/*"
          />
          {uploading && <p>Uploading image...</p>}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
