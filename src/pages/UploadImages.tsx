import { useState } from "react";
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
import { Upload, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import UploadImagesDialog from "@/components/UploadImagesDialog";

interface UploadedImage {
  id: number;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

const UploadImages = () => {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 54;
  
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

  // Calculate pagination
  const totalPages = Math.ceil(uploadedImages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImages = uploadedImages.slice(startIndex, endIndex);

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
              {currentImages.map((image) => (
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
