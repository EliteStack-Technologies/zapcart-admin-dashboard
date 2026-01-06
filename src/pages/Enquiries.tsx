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
import { Eye, Loader2, RefreshCw, ShoppingCart } from "lucide-react";
import {
  getEnquiries,
  getEnquiryById,
  convertEnquiryToOrder,
  Enquiry,
} from "@/services/enquiry";
import { format, isValid, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const { currency } = useCurrency();
  const { toast } = useToast();

  // View Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchEnquiries = async (page = 1, search?: string) => {
    setLoading(true);
    try {
      const data = await getEnquiries(page, limit, search);
      setEnquiries(data.enquiries || []);
      setTotalPages(data.totalPages || 1);
      setTotalEnquiries(data.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch enquiries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(1, searchTerm);
  }, [limit]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchEnquiries(1, searchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleViewEnquiry = async (enquiryId: string) => {
    setLoadingDetails(true);
    setViewDialogOpen(true);
    try {
      const data = await getEnquiryById(enquiryId);
      setSelectedEnquiry(data);
    } catch (error) {
      console.error("Error fetching enquiry details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch enquiry details",
        variant: "destructive",
      });
      setViewDialogOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!selectedEnquiry) return;

    setConverting(true);
    try {
      await convertEnquiryToOrder(selectedEnquiry._id);
      toast({
        title: "Success",
        description: "Enquiry converted to order successfully",
      });
      setViewDialogOpen(false);
      setSelectedEnquiry(null);
      fetchEnquiries(currentPage, searchTerm);
    } catch (error: any) {
      console.error("Error converting enquiry:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to convert enquiry to order",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "MMM dd, yyyy HH:mm") : "N/A";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Enquiry Management</h1>
      
        </div>

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by customer name or phone..."
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
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enquiries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        No enquiries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    enquiries.map((enquiry, index) => (
                      <TableRow key={enquiry._id}>
                        <TableCell>
                          {(currentPage - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {enquiry.customer_name}
                        </TableCell>
                        <TableCell>{enquiry.customer_phone}</TableCell>
                        <TableCell>
                          {enquiry.items?.length || 0} item(s)
                        </TableCell>
                        <TableCell>
                          {enquiry.enquiry_status === "converted" ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Converted
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>

                        <TableCell>{formatDate(enquiry.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewEnquiry(enquiry._id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                   
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalEnquiries > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Showing {(currentPage - 1) * limit + 1} to{" "}
                    {Math.min(currentPage * limit, totalEnquiries)} of{" "}
                    {totalEnquiries} enquiries
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
                        onClick={() =>
                          fetchEnquiries(currentPage - 1, searchTerm)
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

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
                              onClick={() => fetchEnquiries(i, searchTerm)}
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
                        onClick={() =>
                          fetchEnquiries(currentPage + 1, searchTerm)
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
          </>
        )}

        {/* View Enquiry Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enquiry Details</DialogTitle>
              <DialogDescription>
                View enquiry information and items
              </DialogDescription>
            </DialogHeader>

            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : selectedEnquiry ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Customer Name
                    </Label>
                    <p className="font-semibold">
                      {selectedEnquiry.customer_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-semibold">
                      {selectedEnquiry.customer_phone}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-semibold">
                      {formatDate(selectedEnquiry.createdAt)}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {selectedEnquiry.enquiry_status === "converted" ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Converted
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </div>
                  
                  {selectedEnquiry.enquiry_status === "converted" && selectedEnquiry.converted_at && (
                    <div>
                      <Label className="text-muted-foreground">Converted At</Label>
                      <p className="font-semibold">
                        {formatDate(selectedEnquiry.converted_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Enquiry Items */}
                {selectedEnquiry.items && selectedEnquiry.items.length > 0 && (
                  <div>
                    <Label className="text-lg font-semibold mb-3 block">
                      Items ({selectedEnquiry.items.length})
                    </Label>
                    <div className="space-y-2">
                      {selectedEnquiry.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="border rounded-lg p-3 bg-muted/30"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold">{item.title}</p>
                              {item.product_code && (
                                <p className="text-sm text-muted-foreground">
                                  Code: {item.product_code}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {currency?.symbol || ""}{" "}
                                {(
                                  (item.price || 0) * (item.quantity || 0)
                                ).toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {currency?.symbol || ""}{" "}
                                {(item.price || 0).toFixed(2)} ×{" "}
                                {item.quantity || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedEnquiry.notes && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <Label className="text-sm font-semibold">Notes</Label>
                    <p className="text-sm mt-1">{selectedEnquiry.notes}</p>
                  </div>
                )}
              </div>
            ) : null}
            <DialogFooter>
              {selectedEnquiry?.enquiry_status === "converted" ? (
                <div className="w-full text-center py-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Already Converted to Order
                  </Badge>
                </div>
              ) : (
                <Button 
                  onClick={handleConvertToOrder} 
                  disabled={converting || loadingDetails}
                  className="w-full sm:w-auto"
                >
                  {converting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Convert to Order
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
