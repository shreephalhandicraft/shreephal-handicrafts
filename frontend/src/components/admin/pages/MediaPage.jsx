import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  FileImage,
  FileVideo,
  FileText,
  Music,
} from "lucide-react";
import { MediaForm } from "@/components/admin/forms/MediaForm";
import { useToast } from "@/hooks/use-toast";

const initialMedia = [
  {
    id: 1,
    name: "trophy-hero.jpg",
    type: "image",
    size: "2.3MB",
    url: "/images/trophy-hero.jpg",
    uploadedBy: "admin",
    uploadDate: "2024-01-20",
    alt: "Golden trophy",
    description: "Main hero image for trophy collection",
  },
  {
    id: 2,
    name: "product-demo.mp4",
    type: "video",
    size: "15.7MB",
    url: "/videos/product-demo.mp4",
    uploadedBy: "john",
    uploadDate: "2024-01-19",
    alt: "",
    description: "Product demonstration video",
  },
  {
    id: 3,
    name: "catalog.pdf",
    type: "document",
    size: "4.2MB",
    url: "/docs/catalog.pdf",
    uploadedBy: "jane",
    uploadDate: "2024-01-18",
    alt: "",
    description: "Product catalog 2024",
  },
  {
    id: 4,
    name: "background-music.mp3",
    type: "audio",
    size: "5.8MB",
    url: "/audio/bg-music.mp3",
    uploadedBy: "mike",
    uploadDate: "2024-01-17",
    alt: "",
    description: "Background music for promotional videos",
  },
  {
    id: 5,
    name: "medal-gallery.jpg",
    type: "image",
    size: "1.9MB",
    url: "/images/medal-gallery.jpg",
    uploadedBy: "admin",
    uploadDate: "2024-01-16",
    alt: "Medal collection",
    description: "Gallery image of medal collection",
  },
];

export function MediaPage() {
  const [media, setMedia] = useState(initialMedia);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState();
  const [deleteMedia, setDeleteMedia] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredMedia = media.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateMedia = (mediaData) => {
    const newMedia = {
      ...mediaData,
      id: Math.max(...media.map((m) => m.id), 0) + 1,
    };
    setMedia((prev) => [...prev, newMedia]);
    setIsFormOpen(false);
    toast({
      title: "File uploaded",
      description: "Media file has been uploaded successfully.",
    });
  };

  const handleEditMedia = (mediaData) => {
    setMedia((prev) =>
      prev.map((m) => (m.id === mediaData.id ? mediaData : m))
    );
    setEditingMedia(undefined);
    toast({
      title: "File updated",
      description: "Media file has been updated successfully.",
    });
  };

  const handleDeleteMedia = (media) => {
    setMedia((prev) => prev.filter((m) => m.id !== media.id));
    setDeleteMedia(undefined);
    toast({
      title: "File deleted",
      description: "Media file has been deleted successfully.",
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      image: FileImage,
      video: FileVideo,
      document: FileText,
      audio: Music,
    };
    const Icon = icons[type];
    return <Icon className="h-4 w-4" />;
  };

  const getTypeBadge = (type) => {
    const variants = {
      image: "default",
      video: "secondary",
      document: "outline",
      audio: "destructive",
    };

    return <Badge variant={variants[type]}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Media</h1>
          <p className="text-muted-foreground">Manage images and media files</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload File
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedia.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(file.type)}
                    {file.name}
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(file.type)}</TableCell>
                <TableCell>{file.size}</TableCell>
                <TableCell>{file.uploadedBy}</TableCell>
                <TableCell>
                  {new Date(file.uploadDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {file.description}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMedia(file)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteMedia(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Media Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload New File</DialogTitle>
          </DialogHeader>
          <MediaForm
            onSubmit={handleCreateMedia}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Media Dialog */}
      <Dialog
        open={!!editingMedia}
        onOpenChange={() => setEditingMedia(undefined)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit File</DialogTitle>
          </DialogHeader>
          {editingMedia && (
            <MediaForm
              media={editingMedia}
              onSubmit={handleEditMedia}
              onCancel={() => setEditingMedia(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Media Dialog */}
      <AlertDialog
        open={!!deleteMedia}
        onOpenChange={() => setDeleteMedia(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteMedia?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMedia && handleDeleteMedia(deleteMedia)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
