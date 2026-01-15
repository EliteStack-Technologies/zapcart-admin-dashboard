import { useEffect, useState, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addCategory, updateCategory } from "@/services/category";

interface AddCategoryDialogProps {
  open: boolean;
  setCategories: any;
  onOpenChange: (open: boolean) => void;
  editingCategory?: {
    _id: number;
    name: string;
    productCount: number;
    image?: string;
  };
}

const AddCategoryDialog = ({
  open,
  onOpenChange,
  setCategories,
  editingCategory,
}: AddCategoryDialogProps) => {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: editingCategory?.name || "",
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or WEBP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedImage(file);
    setImageError("");
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: any) => {
    // Validate image is provided
    if (!selectedImage && !imagePreview) {
      setImageError("Category image is required");
      toast({
        title: "Validation Error",
        description: "Please upload a category image",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("name", data.name);
      
      // Append image file if a new file was selected
      if (selectedImage) {
        formData.append("image", selectedImage);
      } else if (imagePreview && editingCategory) {
        // If editing and using existing image URL, send it as string
        formData.append("image", imagePreview);
      }

      if (editingCategory) {
        // UPDATE MODE
        const response = await updateCategory(String(editingCategory._id), formData);
        const updatedCategory = response?.data || response;

        if (setCategories) {
          setCategories((prev: any[]) =>
            prev.map((c) =>
              c._id === editingCategory._id ? updatedCategory : c
            )
          );
        }

        toast({
          title: "Category updated",
          description: "Your category has been successfully updated.",
        });
      } else {
        // CREATE MODE
        const response = await addCategory(formData);
        const newCategory = response?.data || response;

        if (setCategories) {
          setCategories((prev: any[]) => [...prev, newCategory]);
        }

        toast({
          title: "Category created",
          description: "Your category has been successfully added.",
        });
      }

      onOpenChange(false);
      reset();
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (editingCategory && open) {
      setValue("name", editingCategory.name);
      
      // Set existing image preview
      const imgUrl = editingCategory.image || editingCategory.image;
      if (imgUrl) {
        setImagePreview(imgUrl);
      }
    } else if (!editingCategory && open) {
      reset();
      setSelectedImage(null);
      setImagePreview(null);
    }
  }, [editingCategory, open, setValue, reset]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? `Edit category #${editingCategory._id}. Update the name and image.`
              : "Create a new product category with name and image."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name*</Label>
              <Input
                id="name"
                placeholder="Beverages"
                {...register("name", { required: "Category name is required" })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category Image*</Label>
              
              {imagePreview ? (
                <div className="relative w-[180px] h-[180px] mx-auto">
                  <img 
                    src={
                      imagePreview.startsWith('data:') 
                        ? imagePreview 
                        : `${import.meta.env.VITE_API_BASE_URL}/uploads/${imagePreview}`
                    }
                    alt="Category preview" 
                    className="w-[180px] h-[180px] object-cover rounded-lg border border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`gap-2 ${imageError ? "border-destructive" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    JPG, PNG or WEBP (max 1MB)
                  </span>
                     <p className="text-xs text-muted-foreground mt-1">
                      Recommended size: 180×180 pixels
                    </p>
                </div>
              )}
              {imageError && (
                <p className="text-xs text-destructive">
                  {imageError}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : editingCategory ? "Update Category" : "Add Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
