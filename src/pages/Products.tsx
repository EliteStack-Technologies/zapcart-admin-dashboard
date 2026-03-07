import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Search, Edit, Trash2, Eye, Check, X, Pencil, FileSpreadsheet } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AddProductDialog from "@/components/AddProductDialog";
import ExcelUploadDialog from "@/components/ExcelUploadDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { getProduct, deleteProduct, changeStatus, updateProduct, updatePriceVisibility } from "@/services/product";
import { getCategory } from "@/services/category";
import { getOfferTags } from "@/services/offersTags";
import { getSections } from "@/services/rows";

const Products = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [excelUploadOpen, setExcelUploadOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<{ productId: string; field: 'actual' | 'offer' } | null>(null);
  const [tempPrice, setTempPrice] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    _id: string;
    title: string;
    description?: string;
    product_code?: string;
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
    variants?: Array<{ variant_name: string; variant_price: number; is_available: boolean; _id?: string; variant_sku?: string }>;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("none");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [offerFilter, setOfferFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sectionFilter, setSectionFilter] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const { currency } = useCurrency();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filters = {
          category_id: categoryFilter.length > 0 ? categoryFilter.join(',') : undefined,
          offer_id: offerFilter.length > 0 ? offerFilter.join(',') : undefined,
          status: statusFilter.length > 0 ? statusFilter.join(',') : undefined,
          section_id: sectionFilter.length > 0 ? sectionFilter.join(',') : undefined
        };
        const data = await getProduct(currentPage, limit, searchTerm || undefined, filters, sortBy);

        // Set products and pagination data from API response
        setProducts(Array.isArray(data?.products) ? data?.products : []);
        setTotalPages(data?.totalPages || 1);
        setTotalProducts(data?.total || 0);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    };
    fetchData();
  }, [currentPage, limit, searchTerm, categoryFilter, offerFilter, statusFilter, sortBy, sectionFilter]);

  // Fetch categories and offers for filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch categories - returns array directly
        const categoriesData = await getCategory();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        // Fetch offers - returns array directly
        const offersData = await getOfferTags();
        setOffers(Array.isArray(offersData) ? offersData : []);

        // Fetch sections
        const sectionsData = await getSections();
        const sectionsList = sectionsData?.sections || sectionsData?.data || (Array.isArray(sectionsData) ? sectionsData : []);
        setSections(sectionsList);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  // Filter products (only client-side filters remain)
  const filteredAndSortedProducts = products
    .filter((product: any) => {
      // Price range filter (client-side only)
      const price = product.actual_price;
      const matchesMinPrice = minPrice === "" || price >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === "" || price <= parseFloat(maxPrice);

      return (
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

  const handleDelete = async () => {
    if (!selectedProduct?._id) return;

    try {
      await deleteProduct(String(selectedProduct._id));

      // Refresh products
      const filters = {
        category_id: categoryFilter.length > 0 ? categoryFilter.join(",") : undefined,
        offer_id: offerFilter.length > 0 ? offerFilter.join(",") : undefined,
        status: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
        section_id: sectionFilter.length > 0 ? sectionFilter.join(",") : undefined,
      };
      const data = await getProduct(currentPage, limit, searchTerm || undefined, filters, sortBy);
      setProducts(Array.isArray(data?.products) ? data?.products : []);
      setTotalPages(data?.totalPages || 1);
      setTotalProducts(data?.total || 0);

      toast({
        title: "Product deleted",
        description: "The product has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
      console.error("Error deleting product:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleStatusToggle = async (product: any) => {
    try {
      // Call API to update product status
      await changeStatus(String(product._id));
      
      // Refresh products with current filters
      const filters = {
        category_id: categoryFilter.length > 0 ? categoryFilter.join(",") : undefined,
        offer_id: offerFilter.length > 0 ? offerFilter.join(",") : undefined,
        status: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
        section_id: sectionFilter.length > 0 ? sectionFilter.join(",") : undefined,
      };
      const data = await getProduct(currentPage, limit, searchTerm || undefined, filters, sortBy);

      // Ensure data is always an array
      setProducts(
        Array.isArray(data?.products) ? data?.products : data?.products || []
      );
      setTotalPages(data?.totalPages || 1);
      setTotalProducts(data?.total || 0);

      toast({
        title: "Status updated",
        description: `Product status changed `,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product status",
        variant: "destructive",
      });
      console.error("Error updating status:", error);
    }
  };

  const handlePriceVisibilityToggle = async (product: any) => {
    try {
      await updatePriceVisibility(String(product._id));
      
      // Refresh products
      const filters = {
        category_id: categoryFilter.length > 0 ? categoryFilter.join(",") : undefined,
        offer_id: offerFilter.length > 0 ? offerFilter.join(",") : undefined,
        status: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
        section_id: sectionFilter.length > 0 ? sectionFilter.join(",") : undefined,
      };
      const data = await getProduct(currentPage, limit, searchTerm || undefined, filters, sortBy);
      setProducts(Array.isArray(data?.products) ? data?.products : []);
      setTotalPages(data?.totalPages || 1);
      setTotalProducts(data?.total || 0);

      toast({
        title: "Price visibility updated",
        description: "Product price visibility has been changed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update price visibility",
        variant: "destructive",
      });
      console.error("Error updating price visibility:", error);
    }
  };

  const handlePriceEdit = (productId: string, field: 'actual' | 'offer', currentPrice: number | null) => {
    setEditingPrice({ productId, field });
    setTempPrice(currentPrice?.toString() || "");
  };

  const handlePriceSave = async (product: any) => {
    if (!editingPrice || !tempPrice) return;

    const newPrice = parseFloat(tempPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", product.title);
      formData.append("unit_type", product.unit_type);
      formData.append("actual_price", editingPrice.field === 'actual' ? newPrice.toString() : product.actual_price.toString());
      formData.append("offer_price", editingPrice.field === 'offer' ? newPrice.toString() : (product.offer_price || "").toString());
      
      if (product.product_code) formData.append("product_code", product.product_code);
      if (product.category_id?._id) formData.append("category_id", product.category_id._id);
      if (product.section_id?._id) formData.append("section_id", product.section_id._id);
      if (product.offer_id?._id) formData.append("offer_id", product.offer_id._id);
      if (product.offer_start_date) formData.append("offer_start_date", product.offer_start_date);
      if (product.offer_end_date) formData.append("offer_end_date", product.offer_end_date);
      if (product.image) formData.append("image_url", product.image);

      await updateProduct(product._id, formData);

      // Refresh product list
      const filters = {
        category_id: categoryFilter.length > 0 ? categoryFilter.join(",") : undefined,
        offer_id: offerFilter.length > 0 ? offerFilter.join(",") : undefined,
        status: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
        section_id: sectionFilter.length > 0 ? sectionFilter.join(",") : undefined,
      };
      const data = await getProduct(currentPage, limit, searchTerm || undefined, filters, sortBy);
      setProducts(Array.isArray(data?.products) ? data?.products : []);
      setTotalPages(data?.totalPages || 1);
      setTotalProducts(data?.total || 0);

      toast({
        title: "Price updated",
        description: `${editingPrice.field === 'actual' ? 'Actual' : 'Offer'} price updated successfully`,
      });

      setEditingPrice(null);
      setTempPrice("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update price",
        variant: "destructive",
      });
      console.error("Error updating price:", error);
    }
  };

  const handlePriceCancel = () => {
    setEditingPrice(null);
    setTempPrice("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground mt-2">
              Manage your product inventory and pricing
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setExcelUploadOpen(true)}>
              <FileSpreadsheet className="w-4 h-4" />
              Upload Excel
            </Button>
            <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </div>
        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search and Sort */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name or code..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Sort By */}
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sort by</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="price-asc">
                      Price (Low to High)
                    </SelectItem>
                    <SelectItem value="price-desc">
                      Price (High to Low)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Filter (Multi-select) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      <span className="truncate">
                        {categoryFilter.length === 0
                          ? "Select Categories"
                          : `${categoryFilter.length} Categories`}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                      {categories.map((cat) => (
                        <div key={cat._id} className="flex items-center space-x-2 p-1 hover:bg-muted rounded text-sm cursor-pointer" 
                             onClick={() => {
                               const newFilter = categoryFilter.includes(cat._id)
                                 ? categoryFilter.filter(id => id !== cat._id)
                                 : [...categoryFilter, cat._id];
                               setCategoryFilter(newFilter);
                               setCurrentPage(1);
                             }}>
                          <Checkbox checked={categoryFilter.includes(cat._id)} onCheckedChange={() => {}} />
                          <Label className="flex-1 cursor-pointer truncate">{cat.name}</Label>
                        </div>
                      ))}
                      {categories.length === 0 && <div className="p-2 text-xs text-muted-foreground text-center">No categories</div>}
                    </div>
                    {categoryFilter.length > 0 && (
                      <div className="border-t p-2">
                        <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => setCategoryFilter([])}>
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Offer Filter (Multi-select) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      <span className="truncate">
                        {offerFilter.length === 0
                          ? "Select Offers"
                          : `${offerFilter.length} Offers`}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                      {offers.map((offer) => (
                        <div key={offer._id} className="flex items-center space-x-2 p-1 hover:bg-muted rounded text-sm cursor-pointer" 
                             onClick={() => {
                               const newFilter = offerFilter.includes(offer._id)
                                 ? offerFilter.filter(id => id !== offer._id)
                                 : [...offerFilter, offer._id];
                               setOfferFilter(newFilter);
                               setCurrentPage(1);
                             }}>
                          <Checkbox checked={offerFilter.includes(offer._id)} onCheckedChange={() => {}} />
                          <Label className="flex-1 cursor-pointer truncate">{offer.name}</Label>
                        </div>
                      ))}
                      {offers.length === 0 && <div className="p-2 text-xs text-muted-foreground text-center">No offers</div>}
                    </div>
                    {offerFilter.length > 0 && (
                      <div className="border-t p-2">
                        <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => setOfferFilter([])}>
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Status Filter (Multi-select) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      <span className="truncate">
                        {statusFilter.length === 0
                          ? "Select Status"
                          : `${statusFilter.length} Statuses`}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="p-2 space-y-1">
                      {['active', 'inactive'].map((s) => (
                        <div key={s} className="flex items-center space-x-2 p-1 hover:bg-muted rounded text-sm cursor-pointer" 
                             onClick={() => {
                               const newFilter = statusFilter.includes(s)
                                 ? statusFilter.filter(id => id !== s)
                                 : [...statusFilter, s];
                               setStatusFilter(newFilter);
                               setCurrentPage(1);
                             }}>
                          <Checkbox checked={statusFilter.includes(s)} onCheckedChange={() => {}} />
                          <Label className="flex-1 cursor-pointer capitalize">{s}</Label>
                        </div>
                      ))}
                    </div>
                    {statusFilter.length > 0 && (
                      <div className="border-t p-2">
                        <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => setStatusFilter([])}>
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Section Filter (Multi-select) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      <span className="truncate">
                        {sectionFilter.length === 0
                          ? "Select Sections"
                          : `${sectionFilter.length} Sections`}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                      {sections.map((section) => (
                        <div key={section._id} className="flex items-center space-x-2 p-1 hover:bg-muted rounded text-sm cursor-pointer" 
                             onClick={() => {
                               const newFilter = sectionFilter.includes(section._id)
                                 ? sectionFilter.filter(id => id !== section._id)
                                 : [...sectionFilter, section._id];
                               setSectionFilter(newFilter);
                               setCurrentPage(1);
                             }}>
                          <Checkbox checked={sectionFilter.includes(section._id)} onCheckedChange={() => {}} />
                          <Label className="flex-1 cursor-pointer truncate">{section.name}</Label>
                        </div>
                      ))}
                      {sections.length === 0 && <div className="p-2 text-xs text-muted-foreground text-center">No sections</div>}
                    </div>
                    {sectionFilter.length > 0 && (
                      <div className="border-t p-2">
                        <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => setSectionFilter([])}>
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Clear Filters Button */}
                {(searchTerm ||
                  sortBy !== "none" ||
                  categoryFilter.length > 0 ||
                  offerFilter.length > 0 ||
                  statusFilter.length > 0 ||
                  sectionFilter.length > 0 ||
                  minPrice ||
                  maxPrice) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSortBy("none");
                      setCategoryFilter([]);
                      setOfferFilter([]);
                      setStatusFilter([]);
                      setSectionFilter([]);
                      setMinPrice("");
                      setMaxPrice("");
                      setCurrentPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SI No</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Actual Price</TableHead>
                  <TableHead>Offer Price</TableHead>
                  <TableHead>Offer Tag</TableHead>
                  <TableHead>Price Visibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedProducts.map((product, index) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        {(currentPage - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell>
                        {product.image || product.image_url ? (
                          <img
                            src={`${
                              import.meta.env.VITE_API_BASE_URL
                            }/uploads/${product.image}`}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                            No Image
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{product.title}</div>
                          {product.variants && product.variants.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Has Variants ({product.variants.length})
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.product_code || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(product.category_id) ? (
                            product.category_id.map((cat: any) => (
                              <Badge key={cat._id} variant="outline" className="text-[10px] px-1 py-0 h-4">
                                {cat.name}
                              </Badge>
                            ))
                          ) : product.category_id?.name ? (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                              {product.category_id.name}
                            </Badge>
                          ) : "--"}
                        </div>
                      </TableCell>
                

                      <TableCell className="font-medium text-primary">
                        {product.variants && product.variants.length > 0 ? (
                          <div className="text-sm">
                            <span className="text-muted-foreground">From </span>
                            <span>{currency?.symbol || "$"}{Math.min(...product.variants.map((v: any) => v.variant_price))}</span>
                          </div>
                        ) : editingPrice?.productId === product._id && editingPrice?.field === 'actual' ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-24 h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePriceSave(product);
                                if (e.key === 'Escape') handlePriceCancel();
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handlePriceSave(product)}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={handlePriceCancel}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2"
                            onClick={() => handlePriceEdit(product._id, 'actual', product.actual_price)}
                          >
                            <span>{currency?.symbol || "$"}{product.actual_price}</span>
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {product.variants && product.variants.length > 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : editingPrice?.productId === product._id && editingPrice?.field === 'offer' ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-24 h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePriceSave(product);
                                if (e.key === 'Escape') handlePriceCancel();
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handlePriceSave(product)}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={handlePriceCancel}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2"
                            onClick={() => handlePriceEdit(product._id, 'offer', product.offer_price)}
                          >
                            {product.offer_price ? (
                              <>
                                <span className="text-green-600 font-semibold">
                                  {currency?.symbol || "$"}{product.offer_price}
                                </span>
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </>
                            ) : (
                              <>
                                <span className="text-muted-foreground">-</span>
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.offer_id ? (
                          <span
                            className="px-2 py-1 text-black rounded-md text-xs font-medium"
                            style={{
                              backgroundColor: product.offer_id?.color_code,
                            }}
                          >
                            {product.offer_id?.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.is_price_visible === true}
                            onCheckedChange={() => handlePriceVisibilityToggle(product)}
                          />
                        </div>
                      </TableCell>
                
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.status === "active"}
                            onCheckedChange={() => handleStatusToggle(product)}
                          />
                        </div>
                      </TableCell>

                

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedProduct(product);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedProduct(product);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedProduct(product);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalProducts > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                {/* Left section - Info and Rows per page */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Showing info */}
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Showing {(currentPage - 1) * limit + 1} to{" "}
                    {Math.min(currentPage * limit, totalProducts)} of{" "}
                    {totalProducts} products
                  </p>

                  {/* Rows per page selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">
                      Rows per page:
                    </label>
                    <Select
                      value={String(limit)}
                      onValueChange={(value) => {
                        setLimit(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="250">250</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right section - Pagination controls */}
                <Pagination>
                  <PaginationContent>
                    {/* Previous button */}
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {/* Page numbers */}
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 5;
                      let startPage = Math.max(
                        1,
                        currentPage - Math.floor(maxVisiblePages / 2)
                      );
                      let endPage = Math.min(
                        totalPages,
                        startPage + maxVisiblePages - 1
                      );

                      if (endPage - startPage < maxVisiblePages - 1) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => setCurrentPage(i)}
                              isActive={currentPage === i}
                              className="cursor-pointer"
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }

                      return pages;
                    })()}

                    {/* Next button */}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AddProductDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          setProducts={setProducts}
        />
        <ExcelUploadDialog
          open={excelUploadOpen}
          onOpenChange={setExcelUploadOpen}
          onUploadSuccess={async () => {
            const filters = {
              category_id: categoryFilter.length > 0 ? categoryFilter.join(',') : undefined,
              offer_id: offerFilter.length > 0 ? offerFilter.join(',') : undefined,
              status: statusFilter.length > 0 ? statusFilter.join(',') : undefined,
              section_id: sectionFilter.length > 0 ? sectionFilter.join(',') : undefined
            };
            const data = await getProduct(currentPage, limit, searchTerm || undefined, filters, sortBy);
            setProducts(Array.isArray(data?.products) ? data?.products : []);
            setTotalPages(data?.totalPages || 1);
            setTotalProducts(data?.total || 0);
          }}
        />
        <AddProductDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editingProduct={selectedProduct || undefined}
          setProducts={setProducts}
        />
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Product"
          description="Are you sure you want to delete this product? This action cannot be undone."
          onConfirm={handleDelete}
        />

        {/* View Product Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base">Product Details</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="grid gap-3 md:grid-cols-[180px,1fr]">
                {/* Product Image */}
                <div className="flex justify-center md:justify-start">
                  {selectedProduct.image || selectedProduct.image_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${
                        selectedProduct.image
                      }`}
                      alt={selectedProduct.title}
                      className="w-44 h-44 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-muted rounded flex items-center justify-center border">
                      <span className="text-xs text-muted-foreground">No Image</span>
                    </div>
                  )}
                </div>

                {/* Product Information - Compact Grid */}
                <div className="space-y-2.5">
                  {/* Title */}
                  <div>
                    <h3 className="font-semibold text-base leading-tight">{selectedProduct.title}</h3>
                    <p className="text-xs text-muted-foreground">SKU: {selectedProduct.product_code || "N/A"}</p>
                    {selectedProduct.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedProduct.description}</p>
                    )}
                  </div>

                  {/* Info Grid - 4 columns */}
                  <div className="grid grid-cols-4 gap-x-3 gap-y-1.5 text-sm pt-1 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium text-sm">
                        {(() => {
                          const cat = selectedProduct.category_id;
                          if (!cat) return "N/A";
                          if (Array.isArray(cat)) return cat.map((c: any) => c.name || c).join(", ") || "N/A";
                          if (typeof cat === "object" && "name" in cat) return cat.name;
                          return String(cat);
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unit</p>
                      <p className="font-medium text-sm">{selectedProduct.unit_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium text-sm capitalize">{selectedProduct.status || "active"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Offer Tag</p>
                      <p className="font-medium text-sm">
                        {typeof selectedProduct.offer_id === "object" && selectedProduct.offer_id?.name
                          ? selectedProduct.offer_id.name
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Pricing - 4 columns */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                    <div className="pt-1.5 border-t space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Product Variants</p>
                      <div className="grid gap-2">
                        {selectedProduct.variants.map((variant: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded border text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{variant.variant_name}</span>
                              {!variant.is_available && (
                                <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                              )}
                            </div>
                            <span className="font-semibold">{currency?.symbol || "$"}{variant.variant_price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                  <div className="grid grid-cols-4 gap-x-3 gap-y-1.5 text-sm pt-1.5 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Actual Price</p>
                      <p className="font-semibold text-sm">{currency?.symbol || "$"}{selectedProduct.actual_price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Offer Price</p>
                      <p className="font-semibold text-sm">
                        {selectedProduct.offer_price ? `${currency?.symbol || "$"}${selectedProduct.offer_price}` : "N/A"}
                      </p>
                    </div>
                    {selectedProduct.offer_price && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">You Save</p>
                          <p className="font-semibold text-sm">
                            {currency?.symbol || "$"}{(selectedProduct.actual_price - selectedProduct.offer_price).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Discount</p>
                          <p className="font-semibold text-sm">
                            {((selectedProduct.actual_price - selectedProduct.offer_price) / selectedProduct.actual_price * 100).toFixed(0)}%
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  )}

                  {/* Offer Period */}
                  {selectedProduct.offer_start_date && selectedProduct.offer_end_date && (
                    <div className="pt-1.5 border-t">
                      <p className="text-xs text-muted-foreground">Offer Period</p>
                      <p className="font-medium text-sm">
                        {new Date(selectedProduct.offer_start_date).toLocaleDateString()} - {new Date(selectedProduct.offer_end_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Products;
