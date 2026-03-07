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
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Upload, X, Loader, Plus, Trash2, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parse, isValid } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { addProduct, updateProduct } from "@/services/product";
import { getProductImages } from "@/services/ProductImage";
import { getOfferTags } from "@/services/offersTags";
import { getCategory } from "@/services/category";
import { getSections } from "@/services/rows";
import { useAuth } from "@/contexts/AuthContext";
interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setProducts?: any;
  editingProduct?: {
    _id: string;
    title: string;
    product_code?: string;
    description?: string;
    actual_price: number;
    offer_price: number | null;
    unit_type: string;
    offer_start_date: string;
    offer_end_date: string;
    image_url?: string;
    image?: string;
    offer_id?: string | { _id: string; name: string };
    category_id?: string | string[] | { _id: string; name: string } | { _id: string; name: string }[];
    section_id?: string | string[] | { _id: string; name: string } | { _id: string; name: string }[];
    status?: string;
    variants?: Array<{ variant_name: string; variant_price: number; is_available: boolean }>;
  };
}

const AddProductDialog = ({
  open,
  onOpenChange,
  editingProduct,
  setProducts,
}: AddProductDialogProps) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [unitType, setUnitType] = useState<string>(
    editingProduct?.unit_type || "Pcs"
  );
  const [offers, setOffers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // Helper to get ID from string or object
  const getId = (item: any) => {
    if (!item) return "";
    return typeof item === "object" ? item._id : item;
  };

  // Helper to safely ensure a value is always an array of ID strings
  const ensureIdArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map((item: any) => (typeof item === 'object' && item?._id ? item._id : String(item))).filter(Boolean);
    }
    if (typeof val === 'object' && val._id) {
      return [val._id];
    }
    if (typeof val === 'string') {
      // Handle comma-separated IDs
      return val.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const [selectedOfferId, setSelectedOfferId] = useState<string>(
    getId(editingProduct?.offer_id)
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auth context to check business type
  const { isRestaurant } = useAuth();
  
  // Variant management states
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Array<{ variant_name: string; variant_price: number; is_available: boolean }>>([
    { variant_name: "", variant_price: 0, is_available: true }
  ]);

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
      product_code: editingProduct?.product_code || "",
      description: editingProduct?.description || "",
      unit_type: editingProduct?.unit_type || "",
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
        product_code: editingProduct.product_code || "",
        description: editingProduct.description || "",
        unit_type: editingProduct.unit_type,
        actual_price: editingProduct.actual_price,
        offer_price: editingProduct.offer_price,
        offer_id: getId(editingProduct.offer_id),
      });

      // Set unit type
      setUnitType(editingProduct.unit_type);

      // Set offer, category, and section (explicitly clear if missing)
      setSelectedOfferId(editingProduct.offer_id ? getId(editingProduct.offer_id) : "");
      setSelectedCategoryId(ensureIdArray(editingProduct.category_id));
      setSelectedSectionId(ensureIdArray(editingProduct.section_id));

      // Set existing image preview
      const imgUrl = editingProduct.image_url || editingProduct.image;
      if (imgUrl) {
        setImagePreview(imgUrl);
      } else {
        setImagePreview(null);
      }

      // Set variants if they exist
      if (editingProduct.variants && editingProduct.variants.length > 0) {
        setHasVariants(true);
        setVariants(editingProduct.variants);
      } else {
        setHasVariants(false);
        setVariants([{ variant_name: "", variant_price: 0, is_available: true }]);
      }

      // Parse dates (explicitly reset if missing)
      setStartDate(undefined);
      setEndDate(undefined);

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
      setUnitType("Pcs");
      setSelectedOfferId("");
        setSelectedCategoryId([]);
        setSelectedSectionId([]);
      setHasVariants(false);
      setVariants([{ variant_name: "", variant_price: 0, is_available: true }]);
    }

    // Fetch product images when dialog opens
    if (open) {
      fetchProductImages();
      fetchOffers();
      fetchCategories();
      fetchSections();
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
      
      // Sync selected offer if editing and list just loaded
      if (editingProduct?.offer_id && open) {
        const id = getId(editingProduct.offer_id);
        if (id) setSelectedOfferId(id);
      }
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
      
      // Sync selected category if editing and list just loaded
      if (editingProduct?.category_id && open) {
        const id = getId(editingProduct.category_id);
        if (id) setSelectedCategoryId(id);
      }
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

  const fetchSections = async () => {
    setLoadingSections(true);
    try {
      const data = await getSections();
      const sectionsList =
        data?.sections || data?.data || (Array.isArray(data) ? data : []);
      setSections(sectionsList);
      
      // Sync selected section if editing and list just loaded
      if (editingProduct?.section_id && open) {
        const id = getId(editingProduct.section_id);
        if (id) setSelectedSectionId(id);
      }
    } catch (error: any) {
      console.error("Error fetching sections:", error);
      toast({
        title: "Error",
        description: "Failed to load sections",
        variant: "destructive",
      });
    } finally {
      setLoadingSections(false);
    }
  };
  // Variant management functions
  const addVariant = () => {
    setVariants([...variants, { variant_name: "", variant_price: 0, is_available: true }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
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


    // Validate variants if enabled
    if (hasVariants && isRestaurant) {
      const validVariants = variants.filter(v => v.variant_name.trim() && v.variant_price > 0);
      if (validVariants.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one valid variant with a name and price",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("title", data.title);
      if (data.product_code) {
        formData.append("product_code", data.product_code);
      }
      if (data.description) {
        formData.append("description", data.description);
      }
 
      // Handle variants or traditional pricing
      if (hasVariants && isRestaurant) {
        const validVariants = variants.filter(v => v.variant_name.trim() && v.variant_price > 0);
        formData.append("variants", JSON.stringify(validVariants));
        // Set default prices for backward compatibility
        formData.append("actual_price", "0");
        formData.append("offer_price", "0");
      } else {
        formData.append("actual_price", Number(data.actual_price).toString());
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
        formData.append("offer_id", selectedOfferId === "none" ? "" : selectedOfferId);
      }
      const safeCategoryIds = ensureIdArray(selectedCategoryId);
      const safeSectionIds = ensureIdArray(selectedSectionId);
      if (safeCategoryIds.length > 0) {
        formData.append("category_id", safeCategoryIds.join(','));
      } else {
        formData.append("category_id", "");
      }
      if (safeSectionIds.length > 0) {
        formData.append("section_id", safeSectionIds.join(','));
      } else {
        formData.append("section_id", "");
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

    // Validate file size (1MB)
    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 1MB",
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
                placeholder=""
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

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product_code">Product Code (Optional)</Label>
                <Input
                  id="product_code"
                  placeholder="Enter product code"
                  {...register("product_code")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_type">Unit Type*</Label>
                <Select value={unitType} onValueChange={setUnitType}>
                  <SelectTrigger id="unit_type">
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nos">Nos</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                    <SelectItem value="Pcs">Pcs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categories</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal" disabled={loadingCategories}>
                    <span className="truncate">
                      {ensureIdArray(selectedCategoryId).length === 0 
                        ? (loadingCategories ? "Loading..." : "Select categories") 
                        : `${ensureIdArray(selectedCategoryId).length} categories selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                    {categories.map((cat) => (
                      <div key={cat._id} className="flex items-center space-x-2 p-1 hover:bg-muted rounded text-sm cursor-pointer"
                           onClick={() => {
                             const safeIds = ensureIdArray(selectedCategoryId);
                             const newIds = safeIds.includes(cat._id)
                               ? safeIds.filter(id => id !== cat._id)
                               : [...safeIds, cat._id];
                             setSelectedCategoryId(newIds);
                           }}>
                        <Checkbox checked={ensureIdArray(selectedCategoryId).includes(cat._id)} onCheckedChange={() => {}} />
                        <Label className="flex-1 cursor-pointer truncate">{cat.name}</Label>
                      </div>
                    ))}
                    {categories.length === 0 && !loadingCategories && <div className="p-2 text-center text-xs text-muted-foreground">No categories available</div>}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer">Offer</Label>
              <Select
                key={`offer-select-${offers.length}`}
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
                  <SelectItem value="none">None</SelectItem>
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
              <Label>Sections</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal" disabled={loadingSections}>
                    <span className="truncate">
                      {ensureIdArray(selectedSectionId).length === 0 
                        ? (loadingSections ? "Loading..." : "Select sections (optional)") 
                        : `${ensureIdArray(selectedSectionId).length} sections selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                    {sections.map((sec) => (
                      <div key={sec._id} className="flex items-center space-x-2 p-1 hover:bg-muted rounded text-sm cursor-pointer"
                           onClick={() => {
                             const safeIds = ensureIdArray(selectedSectionId);
                             const newIds = safeIds.includes(sec._id)
                               ? safeIds.filter(id => id !== sec._id)
                               : [...safeIds, sec._id];
                             setSelectedSectionId(newIds);
                           }}>
                        <Checkbox checked={ensureIdArray(selectedSectionId).includes(sec._id)} onCheckedChange={() => {}} />
                        <Label className="flex-1 cursor-pointer truncate">{sec.name}</Label>
                      </div>
                    ))}
                    {sections.length === 0 && !loadingSections && <div className="p-2 text-center text-xs text-muted-foreground">No sections available</div>}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Variant Builder - Only for Restaurant Businesses */}
            {isRestaurant && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="has-variants" className="text-base font-semibold">Size/Portion Options</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable if this product has different sizes or portions
                    </p>
                  </div>
                  <Switch
                    id="has-variants"
                    checked={hasVariants}
                    onCheckedChange={(checked) => {
                      setHasVariants(checked);
                      if (!checked) {
                        setVariants([{ variant_name: "", variant_price: 0, is_available: true }]);
                      }
                    }}
                  />
                </div>

                {hasVariants && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Variants</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addVariant}
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Variant
                      </Button>
                    </div>

                    {variants.map((variant, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 bg-background rounded border">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Variant name (e.g., Small, Medium, Large)"
                            value={variant.variant_name}
                            onChange={(e) => updateVariant(index, "variant_name", e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Price"
                              value={variant.variant_price || ""}
                              onChange={(e) => updateVariant(index, "variant_price", parseFloat(e.target.value) || 0)}
                              className="flex-1"
                            />
                            <div className="flex items-center gap-2 px-3 border rounded-md bg-muted/30">
                              <Label htmlFor={`variant-available-${index}`} className="text-sm cursor-pointer whitespace-nowrap">
                                Available
                              </Label>
                              <Switch
                                id={`variant-available-${index}`}
                                checked={variant.is_available}
                                onCheckedChange={(checked) => updateVariant(index, "is_available", checked)}
                              />
                            </div>
                          </div>
                        </div>
                        {variants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVariant(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Traditional Pricing - Only shown when variants are disabled or not a restaurant */}
            {(!hasVariants || !isRestaurant) && (
              <div className="grid gap-4 md:grid-cols-2">
             
              <div className="space-y-2">
                <Label htmlFor="actual_price">Actual Price*</Label>
                <Input
                  id="actual_price"
                  type="number"
                  step="0.01"
                  {...register("actual_price", {
                    required: !hasVariants ? "Actual price is required" : false,
                  })}
                />
                {errors.actual_price && (
                  <p className="text-xs text-destructive">
                    {errors.actual_price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer_price">Offer Price*</Label>
                <Input
                  id="offer_price"
                  type="number"
                  step="0.01"
                  {...register("offer_price", {
                    required: !hasVariants ? "Offer price is required" : false,
                    validate: (value) => {
                      if (hasVariants) return true;
                      const offerPrice = Number(value);
                      const actualPrice = Number(watch("actual_price"));
                      if (offerPrice < 0) return "Offer price cannot be negative";
                      if (actualPrice && offerPrice > actualPrice) {
                        return "Offer price cannot be higher than actual price";
                      }
                      return true;
                    }
                  })}
                />
                {errors.offer_price && (
                  <p className="text-xs text-destructive">
                    {errors.offer_price.message}
                  </p>
                )}
              </div>
            </div>
            )}

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


              {imagePreview ? (
                <div className="relative w-[180px] h-[180px] mx-auto">
                  <img
                    src={
                      imagePreview.startsWith('data:') 
                        ? imagePreview 
                        : `${import.meta.env.VITE_API_BASE_URL}/uploads/${imagePreview}`
                    }
                    alt="Product preview"
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
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload New Image
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG or WEBP (max 2MB)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended size: 180×180 pixels
                    </p>
                  </div>
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
