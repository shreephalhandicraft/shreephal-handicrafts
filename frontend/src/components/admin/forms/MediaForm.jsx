import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function MediaForm({ media, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: media?.name || "",
    type: media?.type || "image",
    size: media?.size || "",
    url: media?.url || "",
    uploadedBy: media?.uploadedBy || "",
    uploadDate: media?.uploadDate || new Date().toISOString().split("T")[0],
    alt: media?.alt || "",
    description: media?.description || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (media) {
      onSubmit({ ...formData, id: media.id });
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">File Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter file name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">File Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="size">File Size</Label>
          <Input
            id="size"
            value={formData.size}
            onChange={(e) => handleChange("size", e.target.value)}
            placeholder="e.g., 2.5MB"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uploadedBy">Uploaded By</Label>
          <Input
            id="uploadedBy"
            value={formData.uploadedBy}
            onChange={(e) => handleChange("uploadedBy", e.target.value)}
            placeholder="Username"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">File URL</Label>
        <Input
          id="url"
          value={formData.url}
          onChange={(e) => handleChange("url", e.target.value)}
          placeholder="https://example.com/file.jpg"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="uploadDate">Upload Date</Label>
          <Input
            id="uploadDate"
            type="date"
            value={formData.uploadDate}
            onChange={(e) => handleChange("uploadDate", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alt">Alt Text</Label>
          <Input
            id="alt"
            value={formData.alt}
            onChange={(e) => handleChange("alt", e.target.value)}
            placeholder="Alt text for accessibility"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="File description or notes"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{media ? "Update" : "Upload"} File</Button>
      </div>
    </form>
  );
}
