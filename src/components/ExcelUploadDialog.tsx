import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { uploadProductsExcel } from "@/services/product";
import { Upload, FileSpreadsheet, Loader, CheckCircle2, AlertCircle, Download, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExcelUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

interface UploadResult {
  message: string;
  total_rows: number;
  total_created: number;
  total_skipped: number;
  available_columns: string[];
  categories_created?: string[];
  sections_created?: string[];
  skipped_rows?: Array<{ row: number; reason: string }>;
}

const ExcelUploadDialog = ({
  open,
  onOpenChange,
  onUploadSuccess,
}: ExcelUploadDialogProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel file (.xlsx, .xls) or CSV file",
        variant: "destructive",
      });
      return;
    }

    // 10MB max
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const result = await uploadProductsExcel(formData);
      setUploadResult(result);

      toast({
        title: "Upload Complete",
        description: `${result.total_created} of ${result.total_rows} products created successfully`,
      });

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Something went wrong during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Upload Products via Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file to bulk-add products. Only the <strong>title</strong> column is required.
            Categories and Sections will be auto-created from the <strong>category</strong> and <strong>section</strong> columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Upload Result */}
          {uploadResult ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    Upload Complete!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {uploadResult.total_created} of {uploadResult.total_rows} products created
                    {uploadResult.total_skipped > 0 && `, ${uploadResult.total_skipped} skipped`}
                  </p>
                </div>
              </div>

              {/* Detected Columns */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Detected Columns
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {uploadResult.available_columns.map((col) => (
                    <Badge key={col} variant="secondary" className="text-xs">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Categories & Sections Created */}
              {( (uploadResult.categories_created && uploadResult.categories_created.length > 0) || 
                 (uploadResult.sections_created && uploadResult.sections_created.length > 0) ) && (
                <div className="space-y-3">
                  {uploadResult.categories_created && uploadResult.categories_created.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Categories Auto-Created
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {uploadResult.categories_created.map((cat) => (
                          <Badge key={cat} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            + {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadResult.sections_created && uploadResult.sections_created.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Sections Auto-Created
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {uploadResult.sections_created.map((sec) => (
                          <Badge key={sec} className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            + {sec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Skipped Rows */}
              {uploadResult.skipped_rows && uploadResult.skipped_rows.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    Skipped Rows
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 bg-muted/50 rounded-md p-2">
                    {uploadResult.skipped_rows.map((row, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        <span className="font-medium">Row {row.row}:</span> {row.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Drag & Drop Zone */}
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
                  ${dragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : selectedFile
                    ? "border-green-400 bg-green-50/50 dark:bg-green-950/20"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-green-600" />
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        Drop your Excel file here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports .xlsx, .xls, and .csv files (max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Accepted Columns Info */}
              <div className="p-3 rounded-md bg-muted/50 border">
                <p className="text-xs font-medium mb-2">Accepted Excel Columns:</p>
                <div className="flex flex-wrap gap-1">
                  {[
                    "title *",
                    "category",
                    "section",
                    "description",
                    "product_code",
                    "actual_price",
                    "offer_price",
                    "unit_type",
                    "stock_count",
                    "status",
                    "image",
                  ].map((col) => (
                    <Badge
                      key={col}
                      variant={col.includes("*") ? "default" : "outline"}
                      className="text-xs"
                    >
                      {col}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * Required field. All other fields are optional.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {uploadResult ? (
            <Button onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Products
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUploadDialog;
