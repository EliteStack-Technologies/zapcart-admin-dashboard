import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddProductDialog from "@/components/AddProductDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { getCategoryProducts } from "@/services/category";
import {
  deleteProduct,
  changeStatus,
  updatePriceVisibility,
} from "@/services/product";
import { useCurrency } from "@/contexts/CurrencyContext";

const CategoryProducts = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { currency } = useCurrency();

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return;

      setLoading(true);
      try {
        const data = await getCategoryProducts(categoryId, searchQuery, currentPage, pageSize);
        
        const productsList = data?.products || [];
        setProducts(productsList);
        setTotalPages(data?.totalPages || 1);
        setTotalProducts(data?.total || 0);

        // Get category name
        if (data?.category) {
          setCategoryName(data.category.name);
        } else if (productsList.length > 0 && productsList[0].category_id) {
          setCategoryName(productsList[0].category_id.name || "Category");
        }
      } catch (error) {
        console.error("Error fetching category products:", error);
        toast({
          title: "Error",
          description: "Failed to load category products",
          variant: "destructive",
        });
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [categoryId, searchQuery, currentPage, pageSize, toast]);

  const handleDelete = async () => {
    if (!selectedProduct?._id) return;

    try {
      await deleteProduct(String(selectedProduct._id));

      // Refresh data
      const data = await getCategoryProducts(categoryId!, searchQuery, currentPage, pageSize);
      setProducts(data?.products || []);
      setTotalProducts(data?.total || 0);
      setTotalPages(data?.totalPages || 1);

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
      await changeStatus(String(product._id));
      const data = await getCategoryProducts(categoryId!, searchQuery, currentPage, pageSize);
      setProducts(data?.products || []);

      toast({
        title: "Status updated",
        description: `Product status changed`,
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
      const data = await getCategoryProducts(categoryId!, searchQuery, currentPage, pageSize);
      setProducts(data?.products || []);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/categories")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {categoryName || "Category"} Products
              </h1>
              <p className="text-muted-foreground mt-2">
                {totalProducts} product(s) in this category
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SI No</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Product Code</TableHead>
                      <TableHead>Actual Price</TableHead>
                      <TableHead>Offer Price</TableHead>
                      <TableHead>Offer Tag</TableHead>
                      <TableHead>Price Visibility</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any, index: number) => (
                      <TableRow key={product._id}>
                        <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
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
                        <TableCell className="text-muted-foreground">
                          {product.product_code || "-"}
                        </TableCell>

                        <TableCell className="font-medium">
                          {product.variants && product.variants.length > 0 ? (
                            <div className="text-sm">
                              <span className="text-muted-foreground">From </span>
                              <span>{currency?.symbol || "$"}{Math.min(...product.variants.map((v: any) => v.variant_price))}</span>
                            </div>
                          ) : (
                            <span>{currency?.symbol || "$"} {product.actual_price}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.variants && product.variants.length > 0 ? (
                            <span className="text-muted-foreground">-</span>
                          ) : product.offer_price ? (
                            <span className="text-primary font-medium">
                              {currency?.symbol || "$"} {product.offer_price}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
                              onCheckedChange={() =>
                                handlePriceVisibilityToggle(product)
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.status === "active"}
                              onCheckedChange={() =>
                                handleStatusToggle(product)
                              }
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
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t gap-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
                    <p>
                      Showing {(currentPage - 1) * pageSize + 1} to{" "}
                      {Math.min(currentPage * pageSize, totalProducts)} of{" "}
                      {totalProducts} products
                    </p>
                    <div className="flex items-center gap-2">
                       <span className="text-xs uppercase font-semibold">Entries:</span>
                       <Select
                         value={String(pageSize)}
                         onValueChange={(val) => {
                           setPageSize(Number(val));
                           setCurrentPage(1);
                         }}
                       >
                         <SelectTrigger className="w-[110px] h-8 text-xs">
                           <SelectValue placeholder="Size" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="25">25 / page</SelectItem>
                           <SelectItem value="50">50 / page</SelectItem>
                           <SelectItem value="100">100 / page</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNumber = i + 1;
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNumber)}
                                  isActive={currentPage === pageNumber}
                                  className="cursor-pointer"
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            pageNumber === currentPage - 2 ||
                            pageNumber === currentPage + 2
                          ) {
                            return <span key={pageNumber} className="px-2">...</span>;
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
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
                  )}
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center py-8">
                <p className="text-muted-foreground">
                  No products found in this category
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
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
      </div>
    </DashboardLayout>
  );
};

export default CategoryProducts;
