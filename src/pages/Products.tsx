import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import AddProductDialog from "@/components/AddProductDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { getProduct,  deleteProduct, changeStatus } from "@/services/product";

const Products = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    _id: string;
    title: string;
    old_price: number;
    actual_price: number;
    offer_price: number | null;
    unit_type: string;
    offer_start_date: string;
    offer_end_date: string;
    image_url: string;
    offer_id: string;
    status?: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);

  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil((products?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = Array.isArray(products) ? products.slice(startIndex, endIndex) : [];

    useEffect(() => {
        const fetchData = async () => {
          try {
            const data = await getProduct();
            
            // Ensure data is always an array
            setProducts(Array.isArray(data?.products) ? data?.products : data?.products || []);
          } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
          }
        };
        fetchData();
      }, []);

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
                {currentProducts.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell>
                      {product.image || product.image_url ? (
                        <img 
                          src={`http://localhost:8000/uploads/${product.image}`} 
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
                    <TableCell>{product.category_id?.name || "--"}</TableCell>
                    <TableCell className="text-muted-foreground line-through">
                      ${product.old_price}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${product.actual_price}
                    </TableCell>
                    <TableCell>
                      {product.offer_price ? (
                        <span className="text-primary font-medium">
                          ${product.offer_price}
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
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, products.length)} of {products.length} products
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
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
      </div>
    </DashboardLayout>
  );
};

export default Products;
