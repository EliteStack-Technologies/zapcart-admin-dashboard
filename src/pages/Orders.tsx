import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, Trash2, Printer, Edit, Save, X, Plus, Clock } from "lucide-react";
import { getOrders, getOrderById, updateOrderStatus, deleteOrder, updateOrderItems, getOrderTimeTracking, Order, OrderItem } from "@/services/orders";
import { getProduct } from "@/services/product";
import { format, isValid, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
  { value: "processing", label: "Processing", color: "bg-purple-500" },
  { value: "shipped", label: "Shipped", color: "bg-indigo-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const { currency } = useCurrency();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const fetchingRef = useRef(false);
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [updating, setUpdating] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState<any[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [timeTracking, setTimeTracking] = useState<any>(null);
  const [loadingTimeTracking, setLoadingTimeTracking] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const fetchStatusCounts = async () => {
    try {
      // Fetch counts for all statuses
      const allData = await getOrders(1, 1);
      const counts: Record<string, number> = { all: allData.total };
      
      // Fetch counts for each status
      await Promise.all(
        ORDER_STATUSES.map(async (status) => {
          const data = await getOrders(1, 1, status.value);
          counts[status.value] = data.total;
        })
      );
      
      setStatusCounts(counts);
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  };

  const fetchOrders = async (page = 1, status?: string) => {
    setLoading(true);
    try {
      const statusFilter = status && status !== "all" ? status : undefined;
      const data = await getOrders(page, limit, statusFilter);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, activeTab);
    fetchStatusCounts();
  }, [activeTab, limit]);

  const handleSearchProducts = async (search: string) => {
    if (!search || search.length < 2) {
      setSearchProducts([]);
      return;
    }
    setLoadingProducts(true);
    try {
      const data = await getProduct(1, 50);
      const filtered = data.products.filter((p: any) => 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.product_code?.toLowerCase().includes(search.toLowerCase())
      );
      setSearchProducts(filtered);
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProductToOrder = (product: any) => {
    const newItem: OrderItem = {
      _id: `temp_${Date.now()}`,
      product_id: {
        _id: product._id,
        title: product.title,
        actual_price: product.actual_price,
        image: product.image
      },
      title: product.title,
      price: product.price,
      offer_price: product.offer_price || product.price,
      quantity: 1,
      product_code: product.product_code
    };
    setEditedItems(prev => [...prev, newItem]);
    setAddItemDialogOpen(false);
    setProductSearchTerm("");
    setSearchProducts([]);
    toast({
      title: "Product added",
      description: `${product.title} has been added to the order`,
    });
  };

  const handleFetchTimeTracking = async (orderId: string) => {
    setLoadingTimeTracking(true);
    try {
      const data = await getOrderTimeTracking(orderId);
      setTimeTracking(data);
    } catch (error) {
      console.error("Error fetching time tracking:", error);
      toast({
        title: "Error",
        description: "Failed to fetch time tracking data",
        variant: "destructive",
      });
    } finally {
      setLoadingTimeTracking(false);
    }
  };

  const handleUpdateOrderItems = async () => {
    if (!selectedOrder) return;
    
    setUpdating(true);
    try {
      const itemsToUpdate = editedItems.map(item => ({
        product_id: typeof item.product_id === 'string' ? item.product_id : item.product_id?._id,
        title: item.title,
        price: item.offer_price || item.price,
        quantity: item.quantity,
        product_code: item.product_code
      }));
      
      await updateOrderItems(selectedOrder._id, itemsToUpdate);
      
      toast({
        title: "Success",
        description: "Order items updated successfully",
      });
      
      setEditMode(false);
      fetchOrders(currentPage, activeTab);
      
      // Refresh the selected order data
      const updatedOrder = await getOrderById(selectedOrder._id);
      setSelectedOrder(updatedOrder);
      setEditedItems(updatedOrder.items);
    } catch (error) {
      console.error("Error updating order items:", error);
      toast({
        title: "Error",
        description: "Failed to update order items",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleViewOrder = useCallback(async (orderId: string) => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) return;
    
    // Check if we already have this order in the list
    const existingOrder = orders.find(order => order._id === orderId);
    if (existingOrder) {
      setSelectedOrder(existingOrder);
      setEditedItems(existingOrder.items);
      setEditMode(false);
      setViewDialogOpen(true);
      handleFetchTimeTracking(orderId);
      return;
    }

    // If not found, fetch from API
    fetchingRef.current = true;
    setDetailsLoading(true);
    try {
      const orderData = await getOrderById(orderId);
      setSelectedOrder(orderData);
      setEditedItems(orderData.items);
      setEditMode(false);
      setViewDialogOpen(true);
      handleFetchTimeTracking(orderId);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
      fetchingRef.current = false;
    }
  }, [orders, toast]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setStatusUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      fetchOrders(currentPage, activeTab);
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus as any });
        // Refresh time tracking data after status change
        handleFetchTimeTracking(orderId);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setDeleting(true);
    try {
      await deleteOrder(orderToDelete);
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      fetchOrders(currentPage, activeTab);
      
      // Close view dialog if the deleted order was being viewed
      if (selectedOrder && selectedOrder._id === orderToDelete) {
        setViewDialogOpen(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const handlePrintOrder = () => {
    if (!selectedOrder) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order ${selectedOrder.order_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .info-section {
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            width: 150px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .items-table td.right {
            text-align: right;
          }
          .items-table td.center {
            text-align: center;
          }
          .total-section {
            margin-top: 20px;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
          }
          .total-label {
            font-weight: bold;
            margin-right: 20px;
            min-width: 150px;
            text-align: right;
          }
          .total-amount {
            font-size: 18px;
            font-weight: bold;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Order Receipt</h1>
        </div>
        
        <div class="info-section">
          <h2>Customer Information</h2>
          <div class="info-row">
            <div class="info-label">Customer Name:</div>
            <div>${selectedOrder.customer_name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Phone Number:</div>
            <div>${selectedOrder.customer_phone}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Order Number:</div>
            <div>${selectedOrder.order_number}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Order Date:</div>
            <div>${formatDate(selectedOrder.createdAt)}</div>
          </div>
      
        </div>

        <div class="info-section">
          <h2>Order Items</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Product Code</th>
                <th class="right">Price</th>
                <th class="center">Quantity</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${selectedOrder.items.map(item => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.product_code || '-'}</td>
                  <td class="right">${currency?.symbol || '₹'} ${item.price.toFixed(2)}</td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">${currency?.symbol || '₹'} ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <div class="total-row">
            <div class="total-label">Subtotal:</div>
            <div>${currency?.symbol || '₹'} ${selectedOrder.subtotal.toFixed(2)}</div>
          </div>
          <div class="total-row total-amount">
            <div class="total-label">Total Amount:</div>
            <div>${currency?.symbol || '₹'} ${Number(selectedOrder.total_amount).toFixed(2)}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "MMM dd, yyyy HH:mm") : "N/A";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-500"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Order Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all" className="relative gap-2">
            All Orders
            {statusCounts.all !== undefined && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold bg-black text-primary-foreground rounded-md">
                {statusCounts.all}
              </span>
            )}
          </TabsTrigger>
          {ORDER_STATUSES.map((status) => (
            <TabsTrigger key={status.value} value={status.value} className="relative gap-2">
              {status.label}
              {statusCounts[status.value] !== undefined && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold bg-black text-primary-foreground rounded-md">
                  {statusCounts[status.value]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search by order number, customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SI No</TableHead>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <TableRow key={order._id}>
                          <TableCell>{(currentPage - 1) * limit + index + 1}</TableCell>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell>{order.customer_phone}</TableCell>
                          <TableCell>{order.items.length} item(s)</TableCell>
                          <TableCell>{currency?.symbol || '₹'} {Number(order.total_amount).toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOrder(order._id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(order._id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalOrders > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                  {/* Left section - Info and Rows per page */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Showing info */}
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalOrders)} of {totalOrders} orders
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
                          onClick={() => fetchOrders(currentPage - 1, activeTab)}
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
                                onClick={() => fetchOrders(i, activeTab)}
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
                          onClick={() => fetchOrders(currentPage + 1, activeTab)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) {
            // Reset state when dialog closes
            setSelectedOrder(null);
            setDetailsLoading(false);
            fetchingRef.current = false;
            setEditMode(false);
            setEditedItems([]);
            setTimeTracking(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription>View complete order information</DialogDescription>
              </div>
              {selectedOrder && (
                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditMode(false);
                          setEditedItems(selectedOrder.items);
                        }}
                        disabled={updating}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleUpdateOrderItems}
                        disabled={updating}
                        className="gap-2"
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(true)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Order
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrintOrder}
                        className="gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Order Number</Label>
                  <p className="font-semibold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-semibold">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer Name</Label>
                  <p className="font-semibold">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-semibold">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.order_status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Change Status</Label>
                  <Select
                    value={selectedOrder.order_status}
                    onValueChange={(value) => handleStatusChange(selectedOrder._id, value)}
                    disabled={statusUpdating}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes Section */}
              {selectedOrder.notes && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <Label className="text-muted-foreground">Order Notes</Label>
                  <p className="mt-2 text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status Timeline */}
              {timeTracking && timeTracking.status_timeline && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Status Timeline
                    </Label>
                    {/* {timeTracking.total_time && (
                      <Badge variant="outline">
                        Total: {timeTracking.total_time.hours}h ({timeTracking.total_time.days}d)
                      </Badge>
                    )} */}
                  </div>
                  
                  {loadingTimeTracking ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {timeTracking.status_timeline.map((timeline: any, index: number) => (
                        <div
                          key={index}
                          className={`rounded border p-2.5 transition-all ${
                            timeline.is_active 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                timeline.is_active ? 'bg-blue-500' : 'bg-gray-300'
                              }`}
                            />
                            
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Badge
                                className={`${
                                  ORDER_STATUSES.find((s) => s.value === timeline.status)?.color ||
                                  'bg-gray-500'
                                } text-white text-xs`}
                              >
                                {ORDER_STATUSES.find((s) => s.value === timeline.status)?.label ||
                                  timeline.status}
                              </Badge>
                              
                              <span className="text-xs text-muted-foreground">
                                {formatDate(timeline.started_at)}
                              </span>
                              
                              {timeline.is_active && (
                                <Badge variant="secondary" className="text-xs ml-auto">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {timeline.note && (
                            <p className="mt-1 ml-4 text-xs text-gray-600 italic">
                              {timeline.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-lg font-semibold">Order Items</Label>
                  {editMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddItemDialogOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Product Code</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        {editMode && <TableHead className="text-center">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(editMode ? editedItems : selectedOrder.items).map((item, index) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{item.title}</p>
                              {item.product_id?.actual_price && (
                                <p className="text-xs text-muted-foreground">
                                  Actual Price: {currency?.symbol || '₹'} {item.product_id.actual_price}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.product_code || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {currency?.symbol || '₹'} {item.offer_price || item.price}
                          </TableCell>
                          <TableCell className="text-center">
                            {editMode ? (
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow empty or any positive number during typing
                                  if (value === '') {
                                    setEditedItems(prev => 
                                      prev.map((i, idx) => 
                                        idx === index ? { ...i, quantity: '' as any } : i
                                      )
                                    );
                                  } else {
                                    const newQuantity = parseInt(value);
                                    if (!isNaN(newQuantity) && newQuantity >= 0) {
                                      setEditedItems(prev => 
                                        prev.map((i, idx) => 
                                          idx === index ? { ...i, quantity: newQuantity } : i
                                        )
                                      );
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  const quantity = value === '' ? 1 : parseInt(value);
                                  if (isNaN(quantity) || quantity < 1) {
                                    setEditedItems(prev => 
                                      prev.map((i, idx) => 
                                        idx === index ? { ...i, quantity: 1 } : i
                                      )
                                    );
                                  } else {
                                    setEditedItems(prev => 
                                      prev.map((i, idx) => 
                                        idx === index ? { ...i, quantity: quantity } : i
                                      )
                                    );
                                  }
                                }}
                                onFocus={(e) => e.target.select()}
                                className="w-20 h-8 text-center"
                              />
                            ) : (
                              <Badge variant="outline">{item.quantity}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {currency?.symbol || '₹'} {(item.offer_price || item.price) * item.quantity}
                          </TableCell>
                          {editMode && (
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (editedItems.length <= 1) {
                                    toast({
                                      title: "Cannot remove item",
                                      description: "Order must have at least one item",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  setEditedItems(prev => prev.filter((_, idx) => idx !== index));
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Price Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Subtotal</Label>
                  <p className="font-semibold">{currency?.symbol || '₹'} {selectedOrder.subtotal}</p>
                </div>
                <div className="flex justify-between text-lg">
                  <Label className="font-bold">Total Amount</Label>
                  <p className="font-bold">{currency?.symbol || '₹'} {Number(selectedOrder.total_amount).toFixed(2)}</p>
                </div>
              </div>

              {/* Delete Button */}
              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    openDeleteDialog(selectedOrder._id);
                    setViewDialogOpen(false);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setOrderToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product to Order</DialogTitle>
            <DialogDescription>
              Search and select a product to add to this order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Search Products</Label>
              <Input
                placeholder="Search by product name or code..."
                value={productSearchTerm}
                onChange={(e) => {
                  setProductSearchTerm(e.target.value);
                  handleSearchProducts(e.target.value);
                }}
                className="mt-1"
              />
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : searchProducts.length > 0 ? (
                <div className="divide-y">
                  {searchProducts.map((product) => (
                    <div
                      key={product._id}
                      className="p-4 hover:bg-muted cursor-pointer flex items-center justify-between"
                      onClick={() => handleAddProductToOrder(product)}
                    >
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Code: {product.product_code || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{currency?.symbol || '₹'} {product.price}</p>
                        {product.actual_price && (
                          <p className="text-xs text-muted-foreground">
                            MRP: {currency?.symbol || '₹'} {product.actual_price}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : productSearchTerm.length >= 2 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No products found
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
