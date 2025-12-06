import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Label } from "@/components/ui/label";
import AddProductDialog from "@/components/AddProductDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { getProduct,  deleteProduct, changeStatus } from "@/services/product";

const Products = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    _id: string;
    title: string;
    product_code?: string;
    old_price: number;
    actual_price: number;
    offer_price: number | null;
    unit_type: string;
    offer_start_date: string;
    offer_end_date: string;
    image_url?: string;
    image?: string;
    offer_id?: string | { _id: string; name: string };
    category_id?: { _id: string; name: string };
    status?: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const { currency } = useCurrency();

    useEffect(() => {
        const fetchData = async () => {
          try {
            const data = await getProduct(currentPage, limit);
            
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
      }, [currentPage, limit]);

  const handleDelete = async () => {
    if (!selectedProduct?._id) return;

    try {
      await deleteProduct(String(selectedProduct._id));
      
      // Update state by filtering out the deleted product
      setProducts((prev) => prev.filter((p) => p._id !== selectedProduct._id));
      
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
            const data = await getProduct();
            
            // Ensure data is always an array
            setProducts(Array.isArray(data?.products) ? data?.products : data?.products || [])


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
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Filter</Button>
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
                  <TableHead>Old Price</TableHead>
                  <TableHead>Actual Price</TableHead>
                  <TableHead>Offer Price</TableHead>
                  <TableHead>Offer Tag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
                    <TableRow key={product._id}>
                      <TableCell>{(currentPage - 1) * limit + index + 1}</TableCell>
                    <TableCell>
                      {product.image || product.image_url ? (
                        <img 
                          src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${product.image}`} 
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.product_code || "-"}
                    </TableCell>
                    <TableCell>{product.category_id?.name || "--"}</TableCell>
                    <TableCell className="text-muted-foreground line-through">
                      {currency?.symbol || '$'}{product.old_price}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {currency?.symbol || '$'}{product.actual_price}
                    </TableCell>
                    <TableCell>
                      {product.offer_price ? (
                        <span className="text-green-600 font-semibold">
                          {currency?.symbol || '$'}{product.offer_price}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.offer_id ? (
<span
  className="px-2 py-1 text-black rounded-md text-xs font-medium"
  style={{ backgroundColor: product.offer_id?.color_code }}
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
                    Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalProducts)} of {totalProducts} products
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
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {/* Page numbers */}
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                      
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
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
              <DialogDescription>
                View complete information about this product
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-6">
                {/* Product Image */}
                <div className="flex justify-center">
                  {selectedProduct.image || selectedProduct.image_url ? (
                    <img 
                      src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${selectedProduct.image}`}
                      alt={selectedProduct.title}
                      className="w-48 h-48 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Product Name</Label>
                    <p className="text-base font-medium">{selectedProduct.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Product Code</Label>
                    <p className="text-base font-medium">{selectedProduct.product_code || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Category</Label>
                    <p className="text-base font-medium">{selectedProduct.category_id?.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Unit Type</Label>
                    <p className="text-base font-medium">{selectedProduct.unit_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <p className="text-base font-medium capitalize">{selectedProduct.status || "active"}</p>
                  </div>
                </div>

                {/* Pricing Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Pricing</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Old Price</Label>
                      <p className="text-base font-medium line-through">{currency?.symbol || '$'}{selectedProduct.old_price}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Actual Price</Label>
                      <p className="text-base font-medium text-primary">{currency?.symbol || '$'}{selectedProduct.actual_price}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Offer Price</Label>
                      <p className="text-base font-medium text-green-600">
                        {selectedProduct.offer_price ? `${currency?.symbol || '$'}${selectedProduct.offer_price}` : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Offer Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Offer Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Offer Tag</Label>
                      <p className="text-base font-medium">
                        {typeof selectedProduct.offer_id === 'object' && selectedProduct.offer_id?.name 
                          ? selectedProduct.offer_id.name 
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Offer Period</Label>
                      <p className="text-base font-medium">
                        {selectedProduct.offer_start_date && selectedProduct.offer_end_date
                          ? `${new Date(selectedProduct.offer_start_date).toLocaleDateString()} - ${new Date(selectedProduct.offer_end_date).toLocaleDateString()}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
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
