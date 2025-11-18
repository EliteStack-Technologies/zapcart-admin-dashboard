import { useState } from "react";
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
import { Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddBannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddBannerDialog = ({ open, onOpenChange }: AddBannerDialogProps) => {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Banner uploaded",
      description: "Your banner has been successfully uploaded.",
    });
    onOpenChange(false);
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Banner</DialogTitle>
          <DialogDescription>
            Upload a promotional banner image for your storefront.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>Banner Image*</Label>
              
              {preview ? (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={preview} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={() => setPreview(null)}
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="banner-upload"
                  className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or WEBP (recommended: 1920x600px)
                    </p>
                  </div>
                  <input
                    id="banner-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              )}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Banner Guidelines:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Recommended size: 1920x600 pixels (16:9 aspect ratio)</li>
                <li>• Maximum file size: 5MB</li>
                <li>• Supported formats: JPG, PNG, WEBP</li>
                <li>• Use high-quality images for best results</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!preview} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Banner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBannerDialog;
