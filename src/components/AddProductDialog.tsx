import { useState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Upload, X, Loader } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { addProduct, updateProduct } from "@/services/product";
import { getProductImages } from "@/services/ProductImage";
import { getOfferTags } from "@/services/offersTags";
import { getCategory } from "@/services/category";
import { getRows } from "@/services/rows";
interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setProducts?: any;
  editingProduct?: {
    _id: string;
    title: string;
    old_price: number;
    actual_price: number;
    offer_price: number | null;
    unit_type: string;
    offer_start_date: string;
    offer_end_date: string;
    image_url?: string;
    image?: string;
    offer_id: string | { _id: string; name: string };
    category_id?: string | { _id: string; name: string };
    row_id?: string | { _id: string; name: string };
    status?: string;
  };
}

const AddProductDialog = ({
  open,
  onOpenChange,
  editingProduct,
  setProducts,
}: AddProductDialogProps) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [unitType, setUnitType] = useState<string>(
    editingProduct?.unit_type || "Nos"
  );
  const [offers, setOffers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  // Helper to get ID from string or object
  const getId = (item: any) => {
    if (!item) return "";
    return typeof item === "object" ? item._id : item;
  };

  const [selectedOfferId, setSelectedOfferId] = useState<string>(
    getId(editingProduct?.offer_id)
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    getId(editingProduct?.category_id)
  );
  const [selectedRowId, setSelectedRowId] = useState<string>(
    getId(editingProduct?.row_id)
  );
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title: editingProduct?.title || "",
      unit_type: editingProduct?.unit_type || "",
      old_price: editingProduct?.old_price || "",
      actual_price: editingProduct?.actual_price || "",
      offer_price: editingProduct?.offer_price || "",
      offer_id: getId(editingProduct?.offer_id),
    },
  });

  // Load editing values when dialog opens
  useEffect(() => {
    if (editingProduct && open) {
      reset({
        title: editingProduct.title,
        unit_type: editingProduct.unit_type,
        old_price: editingProduct.old_price,
        actual_price: editingProduct.actual_price,
        offer_price: editingProduct.offer_price,
        offer_id: getId(editingProduct.offer_id),
      });

      // Set unit type
      setUnitType(editingProduct.unit_type);

      // Set offer and category
      if (editingProduct.offer_id) {
        setSelectedOfferId(getId(editingProduct.offer_id));
      }
      if (editingProduct.category_id) {
        setSelectedCategoryId(getId(editingProduct.category_id));
      }
      if (editingProduct.row_id) {
        setSelectedRowId(getId(editingProduct.row_id));
      }

      // Set existing image preview
      const imgUrl = editingProduct.image_url || editingProduct.image;
      if (imgUrl) {
        setImagePreview(imgUrl);
      }

      // Parse dates
      if (editingProduct.offer_start_date) {
        let parsedDate = parse(
          editingProduct.offer_start_date,
          "yyyy-MM-dd",
          new Date()
        );
        if (!isValid(parsedDate)) {
          parsedDate = new Date(editingProduct.offer_start_date);
        }
        if (isValid(parsedDate)) {
          setStartDate(parsedDate);
        }
      }

      if (editingProduct.offer_end_date) {
        let parsedDate = parse(
          editingProduct.offer_end_date,
          "yyyy-MM-dd",
          new Date()
        );
        if (!isValid(parsedDate)) {
          parsedDate = new Date(editingProduct.offer_end_date);
        }
        if (isValid(parsedDate)) {
          setEndDate(parsedDate);
        }
      }
    } else if (!editingProduct && open) {
      reset();
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedImage(null);
      setImagePreview(null);
      setUnitType("Nos");
      setSelectedOfferId("");
      setSelectedCategoryId("");
      setSelectedRowId("");
    }

    // Fetch product images when dialog opens
    if (open) {
      fetchProductImages();
      fetchOffers();
      fetchCategories();
      fetchRows();
    }
  }, [editingProduct, open, reset]);

  const fetchProductImages = async () => {
    setLoadingImages(true);
    try {
      const data = await getProductImages();
      // Handle flexible response format
      const images =
        data?.images || data?.data || (Array.isArray(data) ? data : []);
      setProductImages(images);
    } catch (error: any) {
      console.error("Error fetching product images:", error);
      toast({
        title: "Error",
        description: "Failed to load product images",
        variant: "destructive",
      });
    } finally {
      setLoadingImages(false);
    }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const data = await getOfferTags();
      const offersList =
        data?.offers || data?.data || (Array.isArray(data) ? data : []);
      setOffers(offersList);
    } catch (error: any) {
      console.error("Error fetching offers:", error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      });
    } finally {
      setLoadingOffers(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await getCategory();
      const categoriesList =
        data?.categories || data?.data || (Array.isArray(data) ? data : []);
      setCategories(categoriesList);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchRows = async () => {
    setLoadingRows(true);
    try {
      const data = await getRows();
      const rowsList =
        data?.rows || data?.data || (Array.isArray(data) ? data : []);
      setRows(rowsList);
      
      // Auto-select first row if not editing and rows exist
      if (!editingProduct && rowsList.length > 0) {
        const firstRowId = rowsList[0]._id || rowsList[0].id;
        setSelectedRowId(firstRowId);
      }
    } catch (error: any) {
      console.error("Error fetching rows:", error);
      toast({
        title: "Error",
        description: "Failed to load rows",
        variant: "destructive",
      });
    } finally {
      setLoadingRows(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!imagePreview) {
      toast({
        title: "Error",
        description: "Please select a cover image for the product",
        variant: "destructive",
      });
      return;
    }

    if (!unitType) {
      toast({
        title: "Error",
        description: "Please select a unit type",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRowId) {
      toast({
        title: "Error",
        description: "Please select a row",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append(
        "old_price",
        data.old_price ? Number(data.old_price).toString() : "0"
      );
      formData.append("actual_price", Number(data.actual_price).toString());
      if (data.offer_price) {
        formData.append("offer_price", Number(data.offer_price).toString());
      }
      formData.append("unit_type", unitType);
      if (startDate && isValid(startDate)) {
        formData.append("offer_start_date", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate && isValid(endDate)) {
        formData.append("offer_end_date", format(endDate, "yyyy-MM-dd"));
      }
      if (selectedOfferId) {
        formData.append("offer_id", selectedOfferId);
      }
      if (selectedCategoryId) {
        formData.append("category_id", selectedCategoryId);
      }
      if (selectedRowId) {
        formData.append("row_id", selectedRowId);
      }

      // Append image file if a new file was selected
      if (selectedImage) {
        formData.append("image", selectedImage);
      } else if (imagePreview && editingProduct) {
        // If editing and using existing image URL, send it as string
        formData.append("image_url", imagePreview);
      }

      if (editingProduct) {
        // UPDATE MODE
        const response = await updateProduct(editingProduct._id, formData);
        const updatedProduct = response?.product || response;

        if (setProducts) {
          setProducts((prev: any[]) =>
            prev.map((p) => (p._id === editingProduct._id ? updatedProduct : p))
          );
        }

        toast({
          title: "Product updated",
          description: "Your product has been successfully updated.",
        });
      } else {
        // CREATE MODE
        const response = await addProduct(formData);
        const newProduct = response?.product || response;

        if (setProducts) {
          setProducts((prev: any[]) => [...prev, newProduct]);
        }

        toast({
          title: "Product created",
          description: "Your product has been successfully added.",
        });
      }

      reset();
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedImage(null);
      setImagePreview(null);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
    setSelectedImageId(""); // Clear dropdown selection when uploading new file
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedImageId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {editingProduct
              ? `Edit product details. Update pricing, category, and offer information.`
              : "Create a new product with pricing and offer details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title*</Label>
              <Input
                id="title"
                placeholder="Premium Rice 10KG"
                {...register("title", {
                  required: "Product title is required",
                })}
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unit_type">Unit Type*</Label>
                <Select value={unitType} onValueChange={setUnitType}>
                  <SelectTrigger id="unit_type">
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nos">Nos</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                  disabled={loadingCategories}
                >
                  <SelectTrigger id="category">
                    <SelectValue
                      placeholder={
                        loadingCategories
                          ? "Loading categories..."
                          : "Select a category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((category) => {
                        const categoryId = category._id || category.id;
                        const categoryName =
                          category.name || category.title || "Category";
                        return (
                          <SelectItem key={categoryId} value={categoryId}>
                            {categoryName}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        {loadingCategories
                          ? "Loading..."
                          : "No categories available"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer">Offer</Label>
              <Select
                value={selectedOfferId}
                onValueChange={setSelectedOfferId}
                disabled={loadingOffers}
              >
                <SelectTrigger id="offer">
                  <SelectValue
                    placeholder={
                      loadingOffers
                        ? "Loading offers..."
                        : "Select an offer (optional)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {offers.length > 0 ? (
                    offers.map((offer) => {
                      const offerId = offer._id || offer.id;
                      const offerName =
                        offer.name || offer.title || offer.tag_name || "Offer";
                      return (
                        <SelectItem key={offerId} value={offerId}>
                          {offerName}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      {loadingOffers ? "Loading..." : "No offers available"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="row">Row*</Label>
              <Select
                value={selectedRowId}
                onValueChange={setSelectedRowId}
                disabled={loadingRows}
              >
                <SelectTrigger id="row">
                  <SelectValue
                    placeholder={
                      loadingRows ? "Loading rows..." : "Select a row"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {rows.length > 0 ? (
                    rows.map((row) => {
                      const rowId = row._id || row.id;
                      const rowName = row.name || "Row";
                      return (
                        <SelectItem key={rowId} value={rowId}>
                          {rowName}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      {loadingRows ? "Loading..." : "No rows available"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="old_price">Old Price</Label>
                <Input
                  id="old_price"
                  type="number"
                  step="0.01"
                  placeholder="520"
                  {...register("old_price")}
                />
                {errors.old_price && (
                  <p className="text-xs text-destructive">
                    {errors.old_price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual_price">Actual Price*</Label>
                <Input
                  id="actual_price"
                  type="number"
                  step="0.01"
                  placeholder="450"
                  {...register("actual_price", {
                    required: "Actual price is required",
                  })}
                />
                {errors.actual_price && (
                  <p className="text-xs text-destructive">
                    {errors.actual_price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer_price">Offer Price</Label>
                <Input
                  id="offer_price"
                  type="number"
                  step="0.01"
                  placeholder="399"
                  {...register("offer_price")}
                />
                {errors.offer_price && (
                  <p className="text-xs text-destructive">
                    {errors.offer_price.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Offer Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Offer End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Image (Cover Image)*</Label>

              {/* Existing Product Images Dropdown */}
              {/* <div className="space-y-2">
                <Label htmlFor="image-select" className="text-sm">Select from Existing Images</Label>
                <Select value={selectedImageId} onValueChange={(value) => {
                  setSelectedImageId(value);
                  const selected = productImages.find((img) => {
                    const imgId = img._id || img.id;
                    return imgId === value;
                  });
                  if (selected) {
                    const imgUrl = selected.image_url || selected.url || selected.imageUrl;
                    setImagePreview(imgUrl);
                    setSelectedImage(null); // Clear file upload
                  }
                }}>
                  <SelectTrigger id="image-select" disabled={loadingImages}>
                    <SelectValue placeholder={loadingImages ? "Loading images..." : "Choose an existing image"} />
                  </SelectTrigger>
                  <SelectContent>
                    {productImages.length > 0 ? (
                      productImages.map((image) => {
                        const imgId = image._id || image.id;
                        const imgUrl = image.image_url || image.url || image.imageUrl;
                        const imgName = image.name || imgUrl?.split('/').pop() || 'Image';
                        return (
                          <SelectItem key={imgId} value={imgId}>
                            {imgName}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        {loadingImages ? "Loading images..." : "No images available"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {loadingImages && <span className="flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" /> Loading images...</span>}
                </p>
              </div> */}

              {/* OR Divider */}
              {/* <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div> */}

              {/* File Upload Section */}
              {imagePreview ? (
                <div className="relative w-full">
                  <img
                    src={`http://localhost:8000/uploads/${imagePreview}`}
                    alt="Product preview "
                    className="w-full h-48 object-cover rounded-lg border border-border"
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
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload New Image
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    JPG, PNG or WEBP (max 5MB)
                  </span>
                </div>
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
            <Button type="submit" disabled={isLoading || !imagePreview}>
              {isLoading
                ? "Loading..."
                : editingProduct
                ? "Update Product"
                : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
