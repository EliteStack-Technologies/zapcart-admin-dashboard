import { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

const Products = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const products = [
    {
      id: 1,
      title: "Premium Coffee Beans",
      category: "Beverages",
      oldPrice: 29.99,
      actualPrice: 24.99,
      offerPrice: 19.99,
      status: "Active",
      offer: "Summer Sale"
    },
    {
      id: 2,
      title: "Organic Green Tea",
      category: "Beverages",
      oldPrice: 22.50,
      actualPrice: 18.50,
      offerPrice: null,
      status: "Active",
      offer: null
    },
    {
      id: 3,
      title: "Dark Chocolate Bar",
      category: "Snacks",
      oldPrice: 7.99,
      actualPrice: 5.99,
      offerPrice: 4.99,
      status: "Active",
      offer: "Flash Deal"
    },
    {
      id: 4,
      title: "Natural Honey Jar",
      category: "Pantry",
      oldPrice: 15.99,
      actualPrice: 12.99,
      offerPrice: null,
      status: "Active",
      offer: null
    },
  ];

  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handleDelete = () => {
    toast({
      title: "Product deleted",
      description: "The product has been successfully removed.",
    });
    setDeleteDialogOpen(false);
    setSelectedProduct(null);
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
                {currentProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-muted-foreground line-through">
                      ${product.oldPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${product.actualPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {product.offerPrice ? (
                        <span className="text-primary font-medium">
                          ${product.offerPrice.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.offer ? (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          {product.offer}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                        {product.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedProduct(product.id);
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
        <AddProductDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
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
