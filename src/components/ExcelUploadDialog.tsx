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
import { uploadProductsExcel, parseExcelHeaders } from "@/services/product";
import { 
  Upload, 
  FileSpreadsheet, 
  Loader, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowLeft, 
  Database, 
  Sparkles,
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExcelUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

interface UploadResult {
  message: string;
  total_rows: number;
  total_created: number;
  total_updated: number;
  total_skipped: number;
  available_columns: string[];
  categories_created?: string[];
  sections_created?: string[];
  skipped_rows?: Array<{ row: number; reason: string }>;
}

const MAPPABLE_FIELDS = [
  { key: "title", label: "Product Title / Name", required: true, description: "The name of the product" },
  { key: "category", label: "Category", required: false, description: "Category name(s). Separate multiple with commas (e.g. Fresh, Organic)" },
  { key: "section", label: "Section / Row", required: false, description: "Section name(s). Separate multiple with commas (e.g. Aisle 1, Bestsellers)" },
  { key: "description", label: "Description", required: false, description: "Product description" },
  { key: "product_code", label: "Product Code / Barcode / SKU", required: false, description: "Unique code or barcode for the product" },
  { key: "actual_price", label: "Actual Price / MRP", required: false, description: "The regular/original price of the product" },
  { key: "offer_price", label: "Offer Price / Selling Price", required: false, description: "The discounted/selling price of the product" },
  { key: "unit_type", label: "Unit Type (e.g. kg, pcs)", required: false, description: "Unit of measurement" },
  { key: "stock_count", label: "Stock Count / Qty", required: false, description: "Available stock count" },
  { key: "status", label: "Status (Active/Inactive)", required: false, description: "Must be 'active' or 'inactive'" },
];

const autoMapHeaders = (excelHeaders: string[]): Record<string, string> => {
  const initialMappings: Record<string, string> = {};
  
  const rules: Record<string, string[]> = {
    title: ["title", "name", "product name", "product_name", "product title", "product_title"],
    category: ["category", "category_name", "category name", "categories"],
    section: ["section", "section_name", "section name", "row", "row_name", "row name", "sections", "rows"],
    description: ["description", "desc", "details", "about"],
    product_code: ["product_code", "product code", "code", "barcode", "sku", "upc"],
    actual_price: ["actual_price", "actual price", "price", "cost", "cost price", "mrp", "original price"],
    offer_price: ["offer_price", "offer price", "sale price", "selling price", "discounted price", "offer"],
    unit_type: ["unit_type", "unit type", "unit", "units"],
    stock_count: ["stock_count", "stock count", "stock", "qty", "quantity", "Quantity", "Qty", "avail_stock"],
    status: ["status", "Status", "active"],
    image: ["image", "Image", "image_url", "ImageUrl", "pic", "photo"],
  };

  excelHeaders.forEach(header => {
    const cleanHeader = header.toLowerCase().trim().replace(/[-_]/g, " ");
    for (const [key, aliases] of Object.entries(rules)) {
      if (initialMappings[key]) continue;
      if (aliases.some(alias => cleanHeader === alias || cleanHeader.includes(alias))) {
        initialMappings[key] = header;
        break;
      }
    }
  });

  return initialMappings;
};

const ExcelUploadDialog = ({
  open,
  onOpenChange,
  onUploadSuccess,
}: ExcelUploadDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"upload" | "mapping" | "result">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = async (file: File) => {
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

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const parsedHeaders = await parseExcelHeaders(formData);
      
      if (!parsedHeaders || parsedHeaders.length === 0) {
        throw new Error("No columns detected in the Excel sheet.");
      }

      setHeaders(parsedHeaders);
      const initialMap = autoMapHeaders(parsedHeaders);
      setMappings(initialMap);
      setStep("mapping");
      
      toast({
        title: "Excel File Loaded",
        description: `Detected ${parsedHeaders.length} columns. We've auto-mapped fields where possible.`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to read file",
        description: err.message || "Something went wrong while parsing headers",
        variant: "destructive",
      });
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
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

  const handleMappingChange = (fieldKey: string, headerName: string) => {
    setMappings(prev => {
      const updated = { ...prev };
      if (headerName === "__none__") {
        delete updated[fieldKey];
      } else {
        updated[fieldKey] = headerName;
      }
      return updated;
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Check if title is mapped
    if (!mappings.title) {
      toast({
        title: "Title mapping required",
        description: "Please select which column contains the product title",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mapping", JSON.stringify(mappings));

      const result = await uploadProductsExcel(formData);
      setUploadResult(result);
      setStep("result");

      toast({
        title: "Upload Complete",
        description: `${result.total_created} created, ${result.total_updated} updated, ${result.total_skipped} skipped`,
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
    setStep("upload");
    setHeaders([]);
    setMappings({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const handleBackToUpload = () => {
    setSelectedFile(null);
    setHeaders([]);
    setMappings({});
    setStep("upload");
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
      <DialogContent className={step === "mapping" ? "max-w-2xl max-h-[85vh] flex flex-col" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Upload Products via Excel
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Select or drop an Excel/CSV file to bulk-import your products."}
            {step === "mapping" && "Map columns from your Excel file to the corresponding fields in our database."}
            {step === "result" && "Review the summary and outcomes of the bulk-import process."}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 py-1.5 border-y text-xs text-muted-foreground my-2 select-none">
          <span className={`flex items-center gap-1.5 font-medium ${step === "upload" ? "text-primary" : ""}`}>
            <span className={`w-5 h-5 flex items-center justify-center rounded-full border text-[11px] ${step === "upload" ? "bg-primary text-primary-foreground border-primary" : "bg-muted"}`}>1</span>
            Select File
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span className={`flex items-center gap-1.5 font-medium ${step === "mapping" ? "text-primary" : ""}`}>
            <span className={`w-5 h-5 flex items-center justify-center rounded-full border text-[11px] ${step === "mapping" ? "bg-primary text-primary-foreground border-primary" : "bg-muted"}`}>2</span>
            Map Columns
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span className={`flex items-center gap-1.5 font-medium ${step === "result" ? "text-primary" : ""}`}>
            <span className={`w-5 h-5 flex items-center justify-center rounded-full border text-[11px] ${step === "result" ? "bg-primary text-primary-foreground border-primary" : "bg-muted"}`}>3</span>
            Import Status
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* STEP 1: UPLOAD FILE */}
          {step === "upload" && (
            <>
              {/* Drag & Drop Zone */}
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 cursor-pointer
                  ${dragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : isParsing
                    ? "border-muted-foreground/25 bg-muted/20 pointer-events-none"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isParsing && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isParsing}
                />

                {isParsing ? (
                  <div className="space-y-3 py-4">
                    <Loader className="w-10 h-10 mx-auto text-primary animate-spin" />
                    <div>
                      <p className="font-medium text-sm">Parsing columns...</p>
                      <p className="text-xs text-muted-foreground">Reading headers from Excel file</p>
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-green-600 animate-pulse" />
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
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

              {/* General Tips */}
              <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 text-xs space-y-1.5 text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Tips for multiple values:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-emerald-700/90 dark:text-emerald-400/90">
                  <li><strong>Multiple Categories / Sections</strong>: Separate values with commas (e.g. <code>Beverages, Fruit Juices</code>). The system will resolve or create them automatically.</li>
                  <li><strong>Field Mapping</strong>: Don't worry about specific column names! You can map whatever headers your Excel file uses in the next step.</li>
                </ul>
              </div>
            </>
          )}

          {/* STEP 2: FIELD MAPPING */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                <Database className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-300">
                  We've scanned <strong>{headers.length} headers</strong> in <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">{selectedFile?.name}</code>. Make sure <strong>Product Title</strong> is mapped properly to ensure product import.
                </div>
              </div>

              {/* Scrollable Mapping Form */}
              <div className="border rounded-lg overflow-hidden divide-y bg-card max-h-[42vh] overflow-y-auto">
                <div className="grid grid-cols-12 bg-muted/50 p-2.5 text-xs font-semibold text-muted-foreground select-none">
                  <div className="col-span-5">Database Field</div>
                  <div className="col-span-7 pl-4">Excel Column Header</div>
                </div>
                {MAPPABLE_FIELDS.map((field) => {
                  const currentMapped = mappings[field.key] || "";
                  const isAutoMapped = currentMapped !== "" && autoMapHeaders(headers)[field.key] === currentMapped;

                  return (
                    <div key={field.key} className="grid grid-cols-12 items-center p-3 hover:bg-muted/10 transition-colors">
                      <div className="col-span-5 space-y-0.5 pr-2">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-destructive font-bold">*</span>}
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal">{field.description}</p>
                      </div>
                      
                      <div className="col-span-7 pl-4 flex items-center gap-2">
                        <Select
                          value={currentMapped || "__none__"}
                          onValueChange={(val) => handleMappingChange(field.key, val)}
                        >
                          <SelectTrigger className="w-full text-xs h-9">
                            <SelectValue placeholder="Ignore / Skip Field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs text-muted-foreground">
                              (Ignore / Skip Field)
                            </SelectItem>
                            {headers.map((h) => (
                              <SelectItem key={h} value={h} className="text-xs">
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {isAutoMapped && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex-shrink-0 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-1.5 rounded-full cursor-help">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Automatically matched</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: RESULT STATUS */}
          {step === "result" && uploadResult && (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    Upload Complete!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Created: <strong className="font-semibold text-green-900 dark:text-green-200">{uploadResult.total_created}</strong> | Updated: <strong className="font-semibold text-green-900 dark:text-green-200">{uploadResult.total_updated}</strong>
                    {uploadResult.total_skipped > 0 && ` | Skipped: ${uploadResult.total_skipped}`}
                  </p>
                </div>
              </div>

              {/* Mapped Columns list */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Mapped Columns Processed
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(mappings).map(([fieldKey, headerName]) => (
                    <Badge key={fieldKey} variant="secondary" className="text-xs bg-muted/65 py-0.5">
                      {MAPPABLE_FIELDS.find(f => f.key === fieldKey)?.label || fieldKey} → {headerName}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Categories & Sections Created */}
              {((uploadResult.categories_created && uploadResult.categories_created.length > 0) || 
                 (uploadResult.sections_created && uploadResult.sections_created.length > 0)) && (
                <div className="space-y-3">
                  {uploadResult.categories_created && uploadResult.categories_created.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Categories Resolved/Created
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
                        Sections Resolved/Created
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
                  <div className="max-h-32 overflow-y-auto space-y-1 bg-muted/50 rounded-md p-2 border">
                    {uploadResult.skipped_rows.map((row, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        <span className="font-medium text-destructive">Row {row.row}:</span> {row.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t">
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isParsing}>
                Cancel
              </Button>
            </>
          )}

          {step === "mapping" && (
            <>
              <Button 
                variant="outline" 
                onClick={handleBackToUpload} 
                disabled={isUploading}
                className="gap-1.5 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change File
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !mappings.title}
                className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Confirm & Import
                  </>
                )}
              </Button>
            </>
          )}

          {step === "result" && (
            <Button onClick={handleClose} className="text-xs bg-green-600 hover:bg-green-700 text-white">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUploadDialog;
