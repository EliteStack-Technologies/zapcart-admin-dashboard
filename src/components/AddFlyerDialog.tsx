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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddFlyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddFlyerDialog = ({ open, onOpenChange }: AddFlyerDialogProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Flyer uploaded",
      description: "Your PDF flyer has been successfully uploaded.",
    });
    onOpenChange(false);
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Flyer</DialogTitle>
          <DialogDescription>
            Upload a PDF flyer or promotional material.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="flyerName">Flyer Name*</Label>
              <Input
                id="flyerName"
                placeholder="November Weekly Deals"
                required
              />
            </div>

            <div className="space-y-4">
              <Label>PDF File*</Label>
              
              {selectedFile ? (
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="p-3 bg-primary/10 rounded">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="flyer-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-1 text-sm text-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF only (max 10MB)</p>
                  </div>
                  <input
                    id="flyer-upload"
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              )}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">File Requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• File format: PDF only</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Recommended: High-resolution PDFs for print quality</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Flyer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFlyerDialog;
