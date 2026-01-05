import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getCustomerOrders, getCustomerOrderById, CustomerOrder } from "@/services/customerAuth";
import { Loader2, ArrowLeft, Eye, Package, ShoppingBag, Search, Calendar, CreditCard, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500", icon: Clock },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500", icon: CheckCircle },
  { value: "processing", label: "Processing", color: "bg-purple-500", icon: Package },
  { value: "shipped", label: "Shipped", color: "bg-indigo-500", icon: Truck },
  { value: "delivered", label: "Delivered", color: "bg-green-500", icon: CheckCircle },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500", icon: XCircle },
];

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currency } = useCurrency();

  useEffect(() => {
    fetchOrders();
  }, [activeTab, currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const statusFilter = activeTab !== "all" ? activeTab : undefined;
      const data = await getCustomerOrders(currentPage, limit, statusFilter);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive",
        });
        navigate("/customer/login");
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    setDetailsLoading(true);
    setViewDialogOpen(true);
    try {
      const orderData = await getCustomerOrderById(orderId);
      setSelectedOrder(orderData);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
      setViewDialogOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "MMM dd, yyyy HH:mm") : "N/A";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status);
    const StatusIcon = statusConfig?.icon || Package;
    return (
      <Badge className={`${statusConfig?.color || "bg-gray-500"} text-white flex items-center gap-1`}>
        <StatusIcon className="h-3 w-3" />
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/customer/profile")}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                <p className="text-sm text-gray-500">Track and manage your orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-4 bg-white shadow-sm h-12">
            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              All Orders
            </TabsTrigger>
            {ORDER_STATUSES.map((status) => (
              <TabsTrigger 
                key={status.value} 
                value={status.value}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                {status.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Search */}
            <Card className="shadow-md border-0">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search by order number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="shadow-md border-0">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-600">No orders found</p>
                  <p className="text-sm text-gray-500">You haven't placed any orders yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <Card key={order._id} className="hover:shadow-lg transition-all border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-bold text-lg text-gray-900">{order.order_number}</p>
                            {getStatusBadge(order.order_status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>{order.items.length} item(s)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-green-600" />
                            <p className="text-2xl font-bold text-green-600">
                              {currency?.symbol || '₹'} {Number(order.total_amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order._id)}
                          className="gap-2 hover:bg-blue-50 hover:border-blue-300 h-10"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="shadow-md border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              Order Details
            </DialogTitle>
            <DialogDescription>Complete information about your order</DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs text-gray-500 font-medium">Order Number</Label>
                  <p className="font-bold text-lg">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium">Order Date</Label>
                  <p className="font-semibold">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.order_status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium">Total Amount</Label>
                  <p className="font-bold text-xl text-green-600">
                    {currency?.symbol || '₹'} {Number(selectedOrder.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 pb-3 border-b last:border-0">
                      {item.product_id?.image && (
                        <img
                          src={item.product_id.image}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{item.title}</p>
                        {item.product_code && (
                          <p className="text-xs text-gray-500">Code: {item.product_code}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {currency?.symbol || '₹'} {item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-lg">
                        {currency?.symbol || '₹'} {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">
                      {currency?.symbol || ""} {selectedOrder.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {selectedOrder.shipping_charge && selectedOrder.shipping_charge > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping Charge:</span>
                      <span className="font-semibold">
                        {currency?.symbol || '₹'} {selectedOrder.shipping_charge.toFixed(2)}
                      </span>
                    </div>
                  ) : null}
                  {selectedOrder.discount && selectedOrder.discount > 0 ? (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span className="font-semibold">
                        - {currency?.symbol || '₹'} {selectedOrder.discount.toFixed(2)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total Amount:</span>
                    <span className="text-green-600">
                      {currency?.symbol || '₹'} {Number(selectedOrder.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <Label className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order Notes
                  </Label>
                  <p className="mt-2 text-sm text-blue-800">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}