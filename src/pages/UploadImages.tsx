import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Upload, Trash2, Search, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import UploadImagesDialog from "@/components/UploadImagesDialog";
import { getProductImages, deleteProductImage } from "@/services/ProductImage";

interface UploadedImage {
  _id?: string;
  id?: number;
  name?: string;
  url?: string;
  image_url?: string;
  size?: number;
  uploadedAt?: string;
  created_at?: string;
  product_id?: string;
}

const UploadImages = () => {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const itemsPerPage = 54;

  // Fetch product images on mount
  useEffect(() => {
    fetchProductImages();
  }, []);

  const fetchProductImages = async () => {
    setIsFetching(true);
    try {
      const data = await getProductImages();
      // Handle different response formats
      const images = Array.isArray(data?.images) ? data.images : Array.isArray(data) ? data : [];
      setUploadedImages(images);
    } catch (error: any) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error",
        description: "Failed to load product images",
        variant: "destructive",
      });
      setUploadedImages([]);
    } finally {
      setIsFetching(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(uploadedImages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImages = uploadedImages.slice(startIndex, endIndex);

  const handleDeleteImage = async () => {
    if (!selectedImageId) return;

    try {
      await deleteProductImage(selectedImageId);
      
      // Remove image from local state
      setUploadedImages((prev) => 
        prev.filter((img) => (img._id || img.id) !== selectedImageId)
      );
      
      toast({
        title: "Image deleted",
        description: "The image has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
      console.error("Error deleting image:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedImageId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Image Library</h1>
            <p className="text-muted-foreground mt-2">
              Manage all your uploaded images in one place
            </p>
          </div>
          <Button className="gap-2" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4" />
            Upload Images
          </Button>
        </div>

        {/* Image Library */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                All Images ({uploadedImages.length})
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
              {isFetching ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : currentImages.length > 0 ? (
                currentImages.map((image) => (
                  <div
                    key={image._id || image.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                  >
                    <img
                      src={image.image_url || image.url}
                      alt={image.name || "Product image"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-xs text-white font-medium truncate mb-1">
                          {image.name || "Image"}
                        </p>
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <span>{image.size ? `${image.size} MB` : "-"}</span>
                          <span>{image.uploadedAt || image.created_at || "-"}</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 rounded-full"
                          onClick={() => {
                            setSelectedImageId(String(image._id || image.id));
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No images found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 py-4 border-t mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, uploadedImages.length)} of {uploadedImages.length} images
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <UploadImagesDialog 
          open={uploadDialogOpen} 
          setUploadedImages={setUploadedImages}
          onOpenChange={setUploadDialogOpen} 
        />
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
