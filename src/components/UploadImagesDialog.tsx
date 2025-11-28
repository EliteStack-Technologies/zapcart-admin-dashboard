import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadProductImages, getProductList } from "@/services/product";

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

interface Product {
  _id: string;
  title: string;
}

interface UploadImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setUploadedImages:any;
}

const UploadImagesDialog = ({ open, onOpenChange,setUploadedImages }: UploadImagesDialogProps) => {
  const { toast } = useToast();
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Load products when dialog opens
  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await getProductList();
      // Ensure data is always an array
      const productList = Array.isArray(data?.products) ? data?.products : Array.isArray(data) ? data : [];
      setProducts(productList);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };





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

  const handleUpload = async () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multi-part file upload
      const formData = new FormData();
      
      // Append all images
      images.forEach((image) => {
        formData.append("images", image.file);
      });

      const response = await uploadProductImages(formData);
      
      // Update parent state with new images from response
      if (setUploadedImages) {
        // Handle different response formats
        let newImages = [];
        if (response?.data) {
          newImages = Array.isArray(response.data) ? response.data : [response.data];
        } else if (response?.images) {
          newImages = Array.isArray(response.images) ? response.images : [response.images];
        }
        
        // Add new images to existing images
        if (newImages.length > 0) {
          setUploadedImages((prev: any[]) => [...prev, ...newImages]);
        }
      }

      toast({
        title: "Images uploaded",
        description: `Successfully uploaded ${images.length} image(s) to product.`,
      });
      
      clearAll();
      setSelectedProduct("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
      console.error("Error uploading images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    clearAll();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
          <DialogDescription>
            Select multiple images to upload. Preview them before uploading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Area */}
          <label
            htmlFor="modal-image-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
          >
            <div className="flex flex-col items-center justify-center">
              <ImageIcon className="w-12 h-12 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm font-semibold text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP (Multiple files supported)
              </p>
            </div>
            <input
              id="modal-image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />
          </label>

          {/* Preview Grid */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Selected Images ({images.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
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
                        className="h-8 w-8 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <p className="text-xs text-white truncate">{image.file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleUpload} 
            disabled={images.length === 0 || isLoading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {isLoading ? "Uploading..." : `Upload ${images.length > 0 ? `${images.length} Image${images.length !== 1 ? "s" : ""}` : "Images"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadImagesDialog;
