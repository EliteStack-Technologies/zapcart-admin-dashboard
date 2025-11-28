import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/services/axiosInstance";

interface AddBannerDialogProps {
  open: boolean;
  setBanners: any;
  onOpenChange: (open: boolean) => void;
  editingBanner?: {
    id: number;
    imageUrl: string;
    status: "active" | "inactive";
    createdAt: string;
  };
}

interface ImagePreview {
  file: File;
  preview: string;
}

const AddBannerDialog = ({
  open,
  onOpenChange,
  setBanners,
  editingBanner,
}: AddBannerDialogProps) => {
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, reset } = useForm();

  // Handle multiple file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          });
          return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 5MB limit`,
            variant: "destructive",
          });
          return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImages((prev) => [
            ...prev,
            {
              file,
              preview: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove image from selection
  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit form with FormData
const onSubmit = async () => {
  if (selectedImages.length === 0) {
    toast({
      title: "No images selected",
      description: "Please select at least one image to upload",
      variant: "destructive",
    });
    return;
  }

  try {
    setIsLoading(true);

    const formData = new FormData();

    selectedImages.forEach((image) => {
      formData.append("images", image.file);
    });

    formData.append("status", editingBanner?.status || "active");

    const response = await axiosInstance.post("/api/v1/banners", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const newBanner = response.data?.banners; // adjust if backend sends different shape

    toast({
      title: "Success",
      description: `${selectedImages.length} image(s) uploaded successfully`,
    });

    // ⬅️ Correct way to update banner list
    if (Array.isArray(newBanner)) {
      setBanners((prev: any) => [...prev, ...newBanner]);
    } else if (newBanner) {
      setBanners((prev: any) => [...prev, newBanner]);
    }

    // Reset form
    setSelectedImages([]);
    reset();
    onOpenChange(false);
  } catch (error: any) {
    toast({
      title: "Upload failed",
      description: error.response?.data?.message || "Failed to upload images",
      variant: "destructive",
    });
    console.error("Upload error:", error);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Banner Images</DialogTitle>
          <DialogDescription>
            Upload one or multiple promotional banner images. All images will be
            uploaded together.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4 ">
            {/* File Upload Area */}
            <div className="space-y-4">
              <Label>Select Images*</Label>

              <label
                htmlFor="banner-upload"
                className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/50 h-[200px]"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-12 h-12 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-foreground">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Select one or multiple images (PNG, JPG, WEBP)
                  </p>
                </div>
                <input
                  id="banner-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </label>
            </div>

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Selected Images ({selectedImages.length})</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImages([])}
                  >
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 max-h-52 overflow-y-auto">
                  {selectedImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-video bg-muted rounded-lg overflow-hidden group"
                    >
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {(image.file.size / 1024 / 1024).toFixed(2)}MB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guidelines */}
            {/* <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Upload Guidelines:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Select multiple images at once</li>
                <li>• Recommended size: 1920x600 pixels (16:9 aspect ratio)</li>
                <li>• Maximum file size per image: 5MB</li>
                <li>• Supported formats: JPG, PNG, WEBP</li>
                <li>• All images will be uploaded together</li>
              </ul>
            </div> */}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={selectedImages.length === 0 || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload{" "}
                  {selectedImages.length > 0
                    ? `(${selectedImages.length})`
                    : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBannerDialog;
