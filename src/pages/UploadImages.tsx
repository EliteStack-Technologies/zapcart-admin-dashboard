import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

interface UploadedImage {
  id: number;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

const UploadImages = () => {
  const { toast } = useToast();
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  
  // Mock uploaded images - replace with real data from backend
  const [uploadedImages] = useState<UploadedImage[]>([
    {
      id: 1,
      name: "product-image-1.jpg",
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      size: 2.4,
      uploadedAt: "2024-01-15"
    },
    {
      id: 2,
      name: "banner-promo.png",
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      size: 1.8,
      uploadedAt: "2024-01-14"
    },
    {
      id: 3,
      name: "category-hero.jpg",
      url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
      size: 3.2,
      uploadedAt: "2024-01-13"
    },
    {
      id: 4,
      name: "offer-banner.jpg",
      url: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400",
      size: 2.1,
      uploadedAt: "2024-01-12"
    },
    {
      id: 5,
      name: "product-showcase.png",
      url: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400",
      size: 1.9,
      uploadedAt: "2024-01-11"
    },
    {
      id: 6,
      name: "brand-logo.png",
      url: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400",
      size: 0.8,
      uploadedAt: "2024-01-10"
    },
  ]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImagePreview[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview,
        });
      }
    });

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const handleUpload = () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to upload.",
        variant: "destructive",
      });
      return;
    }

    // Here you would upload to backend
    toast({
      title: "Images uploaded",
      description: `Successfully uploaded ${images.length} image(s).`,
    });
    clearAll();
  };

  const handleDeleteImage = () => {
    toast({
      title: "Image deleted",
      description: "The image has been successfully removed.",
    });
    setDeleteDialogOpen(false);
    setSelectedImageId(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Upload Images</h1>
            <p className="text-muted-foreground mt-2">
              Upload multiple images at once and preview before saving
            </p>
          </div>
          <div className="flex gap-3">
            {images.length > 0 && (
              <>
                <Button variant="outline" onClick={clearAll}>
                  Clear All
                </Button>
                <Button onClick={handleUpload} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload {images.length} Image{images.length !== 1 ? "s" : ""}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <Card>
          <CardContent className="p-12">
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex flex-col items-center justify-center">
                <ImageIcon className="w-16 h-16 mb-4 text-muted-foreground" />
                <p className="mb-2 text-lg font-semibold text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, WEBP (Multiple files supported)
                </p>
              </div>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
              />
            </label>
          </CardContent>
        </Card>

        {/* Preview Grid */}
        {images.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Preview ({images.length} image{images.length !== 1 ? "s" : ""})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border"
                  >
                    <img
                      src={image.preview}
                      alt={image.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeImage(image.id)}
                        className="rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white truncate">{image.file.name}</p>
                      <p className="text-xs text-white/70">
                        {(image.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Uploaded Images List */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                Uploaded Images ({uploadedImages.length})
              </h2>
              <div className="flex-1 max-w-md ml-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search images..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {uploadedImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-white font-medium truncate mb-1">
                        {image.name}
                      </p>
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span>{image.size} MB</span>
                        <span>{image.uploadedAt}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          setSelectedImageId(image.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Image"
          description="Are you sure you want to delete this image? This action cannot be undone."
          onConfirm={handleDeleteImage}
        />
      </div>
    </DashboardLayout>
  );
};

export default UploadImages;
