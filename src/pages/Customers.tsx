import { useState, useEffect } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Loader2, Trash2, Edit, Plus, UserPlus, ShoppingBag } from "lucide-react";
import {
  getCustomers,
  getCustomerById,
  getCustomerOrders,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  Customer,
  CreateCustomerData,
  UpdateCustomerData,
} from "@/services/customer";
import { format, isValid, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const { currency } = useCurrency();
  const { toast } = useToast();

  // Add/Edit Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: "",
    phone: "",
    email: "",
    street_address: "",
    region: "",
    country: "",
    contact_person: "",
    contact_mobile: "",
    address: "",
  });

  // View Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Order Items Dialog
  const [orderItemsDialogOpen, setOrderItemsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = async (page = 1, search?: string) => {
    setLoading(true);
    try {
      const data = await getCustomers(page, limit, search);
      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
      setTotalCustomers(data.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, searchTerm);
  }, [limit]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchCustomers(1, searchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Name and phone are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await createCustomer(formData);
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      setAddDialogOpen(false);
      setFormData({ name: "", phone: "", email: "", street_address: "", region: "", country: "", contact_person: "", contact_mobile: "", address: "" });
      fetchCustomers(currentPage, searchTerm);
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    if (!formData.name || !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Name and phone are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updateCustomer(selectedCustomer._id, formData as UpdateCustomerData);
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      setEditDialogOpen(false);
      setSelectedCustomer(null);
      setFormData({ name: "", phone: "", email: "", street_address: "", region: "", country: "", contact_person: "", contact_mobile: "", address: "" });
      fetchCustomers(currentPage, searchTerm);
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewCustomer = async (customerId: string) => {
    setLoadingDetails(true);
    setViewDialogOpen(true);
    try {
      const data = await getCustomerOrders(customerId, 1, 10);
      setCustomerDetails(data);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customer details",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      street_address: customer.street_address || "",
      region: customer.region || "",
      country: customer.country || "",
      contact_person: customer.contact_person || "",
      contact_mobile: customer.contact_mobile || "",
      address: customer.address || "",
    });
    setEditDialogOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    setDeleting(true);
    try {
      await deleteCustomer(customerToDelete);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      fetchCustomers(currentPage, searchTerm);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (customerId: string) => {
    setCustomerToDelete(customerId);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "MMM dd, yyyy") : "N/A";
  };

  const filteredCustomers = customers;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by name, phone, or email..."
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
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer, index) => (
                      <TableRow key={customer._id}>
                        <TableCell>{(currentPage - 1) * limit + index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{customer.customer_id || "-"}</TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.email || "-"}</TableCell>
                        <TableCell>{customer.total_orders}</TableCell>
                        <TableCell>
                          {currency?.symbol || "₹"} {customer.total_spent.toFixed(2)}
                        </TableCell>
                        <TableCell>{formatDate(customer.last_order_date)}</TableCell>
                        <TableCell>
                          <Badge variant={customer.created_source === "manual" ? "secondary" : "default"}>
                            {customer.created_source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCustomer(customer._id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(customer._id)}
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

            {totalCustomers > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Showing {(currentPage - 1) * limit + 1} to{" "}
                    {Math.min(currentPage * limit, totalCustomers)} of {totalCustomers} customers
                  </p>

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
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => fetchCustomers(currentPage - 1, searchTerm)}
                        className={
                          currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

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
                              onClick={() => fetchCustomers(i, searchTerm)}
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

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => fetchCustomers(currentPage + 1, searchTerm)}
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
          </>
        )}

        {/* Add Customer Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Create a new customer manually</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="contact-person">Contact Person</Label>
                <Input
                  id="contact-person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>

              <div>
                <Label htmlFor="contact-mobile">Contact Mobile</Label>
                <Input
                  id="contact-mobile"
                  value={formData.contact_mobile}
                  onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                  placeholder="Enter contact mobile number"
                />
              </div>

              <div>
                <Label htmlFor="street-address">Street Address</Label>
                <Textarea
                  id="street-address"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  placeholder="Enter street address"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="region">Region/State</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Enter region or state"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>

              <div>
                <Label htmlFor="address">Additional Notes</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter additional address notes"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Customer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer information</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label htmlFor="edit-name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="edit-contact-person">Contact Person</Label>
                <Input
                  id="edit-contact-person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>

              <div>
                <Label htmlFor="edit-contact-mobile">Contact Mobile</Label>
                <Input
                  id="edit-contact-mobile"
                  value={formData.contact_mobile}
                  onChange={(e) => setFormData({ ...formData, contact_mobile: e.target.value })}
                  placeholder="Enter contact mobile number"
                />
              </div>

              <div>
                <Label htmlFor="edit-street-address">Street Address</Label>
                <Textarea
                  id="edit-street-address"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  placeholder="Enter street address"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="edit-region">Region/State</Label>
                <Input
                  id="edit-region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Enter region or state"
                />
              </div>

              <div>
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>

              <div>
                <Label htmlFor="edit-address">Additional Notes</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter additional address notes"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleEditCustomer} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Customer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Customer Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>View customer information and order history</DialogDescription>
            </DialogHeader>

            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : customerDetails ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Customer ID</Label>
                    <p className="font-mono text-sm">{customerDetails.customer.customer_id || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-semibold">{customerDetails.customer.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{customerDetails.customer.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-semibold">{customerDetails.customer.email || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Orders</Label>
                    <p className="font-semibold">{customerDetails.customer.total_orders}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Spent</Label>
                    <p className="font-semibold">
                      {currency?.symbol || "₹"} {customerDetails.customer.total_spent.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Order</Label>
                    <p className="font-semibold">
                      {formatDate(customerDetails.customer.last_order_date)}
                    </p>
                  </div>
                </div>

                {/* Address Information */}
                {(customerDetails.customer.contact_person || customerDetails.customer.contact_mobile || customerDetails.customer.street_address || customerDetails.customer.region || customerDetails.customer.country || customerDetails.customer.address) && (
                  <div className="border-t pt-4">
                    <Label className="text-lg font-semibold mb-3 block">Address Information</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {customerDetails.customer.contact_person && (
                        <div>
                          <Label className="text-muted-foreground">Contact Person</Label>
                          <p className="font-semibold">{customerDetails.customer.contact_person}</p>
                        </div>
                      )}
                      {customerDetails.customer.contact_mobile && (
                        <div>
                          <Label className="text-muted-foreground">Contact Mobile</Label>
                          <p className="font-semibold">{customerDetails.customer.contact_mobile}</p>
                        </div>
                      )}
                      {customerDetails.customer.street_address && (
                        <div className="col-span-2">
                          <Label className="text-muted-foreground">Street Address</Label>
                          <p className="font-semibold">{customerDetails.customer.street_address}</p>
                        </div>
                      )}
                      {customerDetails.customer.region && (
                        <div>
                          <Label className="text-muted-foreground">Region/State</Label>
                          <p className="font-semibold">{customerDetails.customer.region}</p>
                        </div>
                      )}
                      {customerDetails.customer.country && (
                        <div>
                          <Label className="text-muted-foreground">Country</Label>
                          <p className="font-semibold">{customerDetails.customer.country}</p>
                        </div>
                      )}
                      {customerDetails.customer.address && (
                        <div className="col-span-2">
                          <Label className="text-muted-foreground">Additional Notes</Label>
                          <p className="font-semibold">{customerDetails.customer.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Order History */}
                <div>
                  <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order History ({customerDetails?.orders?.total || 0})
                  </Label>

                  {!customerDetails?.orders?.data || customerDetails.orders.data.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No orders yet</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order Number</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerDetails.orders.data.map((order: any) => (
                            <TableRow key={order._id}>
                              <TableCell className="font-medium">{order.order_number}</TableCell>
                              <TableCell>{order.items.length} item(s)</TableCell>
                              <TableCell>
                                {currency?.symbol || "₹"} {order.total_amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge>{order.order_status}</Badge>
                              </TableCell>
                              <TableCell>{formatDate(order.createdAt)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setOrderItemsDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this customer? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setCustomerToDelete(null);
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCustomer} disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Items Dialog */}
        <Dialog open={orderItemsDialogOpen} onOpenChange={setOrderItemsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
              <DialogDescription>
                Order placed on {selectedOrder && formatDate(selectedOrder.createdAt)}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <Badge>{selectedOrder.order_status}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold">
                      {currency?.symbol || "₹"} {selectedOrder.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-lg font-semibold mb-3 block">Product Items</Label>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any) => (
                      <div key={item._id} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{item.title}</p>
                            {item.product_code && (
                              <p className="text-sm text-muted-foreground">Code: {item.product_code}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {currency?.symbol || "₹"} {(item.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {currency?.symbol || "₹"} {item.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-semibold">Subtotal ({selectedOrder.items.length} items)</span>
                  <span className="text-xl font-bold">
                    {currency?.symbol || "₹"} {selectedOrder.subtotal.toFixed(2)}
                  </span>
                </div>

                {selectedOrder.notes && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <Label className="text-sm font-semibold">Order Notes</Label>
                    <p className="text-sm mt-1">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
