import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  TestTube2,
  Power,
  Building2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import {
  getZohoConfig,
  testConnection,
  updateZohoConfig,
  disconnectZoho,
  getOrdersWithZohoStatus,
  getZohoSyncStats,
  syncOrderToZoho,
  syncAllOrders,
  getCustomerSyncStats,
  type ZohoConfig,
  type OrderWithZoho,
  type ZohoSyncStats,
  type CustomerSyncStats,
  type ZohoOrganization,
} from "@/services/zoho";
import OAuthConnectionDialog from "@/components/OAuthConnectionDialog";
import OrganizationSelector from "@/components/OrganizationSelector";

// Zoho logo SVG component
const ZohoLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#1A73E8"/>
    <path d="M6 8h12l-8 8h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ZohoBooksIntegration = () => {
  const { zohoEnabled, setZohoEnabled } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  
  const [config, setConfig] = useState<ZohoConfig | null>(null);
  const [showOAuthDialog, setShowOAuthDialog] = useState(false);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [organizations, setOrganizations] = useState<ZohoOrganization[]>([]);
  
  const [orders, setOrders] = useState<OrderWithZoho[]>([]);
  const [syncStats, setSyncStats] = useState<ZohoSyncStats>({ total: 0, synced: 0, failed: 0, pending: 0 });
  const [customerStats, setCustomerStats] = useState<CustomerSyncStats>({ synced: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [syncingOrders, setSyncingOrders] = useState<Set<string>>(new Set());
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  // Fetch configuration on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  // Handle organization selection step from URL
  useEffect(() => {
    const step = searchParams.get("step");
    if (step === "select-org" && config?.has_credentials) {
      handleTestConnection();
    }
  }, [searchParams, config]);

  const fetchConfig = async () => {
    try {
      setIsFetching(true);
      const configData = await getZohoConfig();
      setConfig(configData);

      // Sync with AuthContext
      if (configData.zoho_enabled !== undefined) {
        setZohoEnabled(configData.zoho_enabled);
      }

      // Fetch sync data if connected and enabled
      if (configData.has_credentials && configData.token_valid && configData.zoho_enabled) {
        await fetchSyncData();
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      toast({
        title: "Error",
        description: "Failed to load Zoho configuration",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const fetchSyncData = async () => {
    try {
      const [statsData, ordersData, customerStatsData] = await Promise.all([
        getZohoSyncStats().catch(() => ({ total: 0, synced: 0, failed: 0, pending: 0 })),
        getOrdersWithZohoStatus(currentPage, 20).catch(() => ({ orders: [], totalPages: 1 })),
        getCustomerSyncStats().catch(() => ({ synced: 0, total: 0 })),
      ]);

      setSyncStats(statsData);
      setOrders(ordersData.orders || []);
      setTotalPages(ordersData.totalPages || 1);
      setCustomerStats(customerStatsData);
    } catch (error) {
      console.error("Error fetching sync data:", error);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      const result = await testConnection();

      if (result.organizations && result.organizations.length > 0) {
        setOrganizations(result.organizations);
        setShowOrgSelector(true);
        // Clear the step parameter
        searchParams.delete("step");
        setSearchParams(searchParams);
      } else {
        toast({
          title: "No Organizations Found",
          description: "No Zoho Books organizations found in your account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error testing connection:", error);
      
      const errorMessage = error?.response?.data?.message || error?.message || "";
      
      // Check for "No refresh token available" error
      if (errorMessage.includes("No refresh token available") || 
          errorMessage.includes("refresh token")) {
        toast({
          title: "Authorization Issue",
          description: "Please revoke the app access in Zoho and reconnect. Go to: Zoho Accounts → Security → Connected Apps → Find 'ZapCart' → Click Revoke → Then reconnect here.",
          variant: "destructive",
        });
        // Also open the Zoho security page
        setTimeout(() => {
          if (confirm("Would you like to open Zoho Security page now?")) {
            window.open("https://accounts.zoho.com/home#security/connectedapps", "_blank");
          }
        }, 500);
      } else {
        toast({
          title: "Connection Failed",
          description: errorMessage || "Failed to connect to Zoho Books",
          variant: "destructive",
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      await updateZohoConfig({ zoho_enabled: enabled });
      setZohoEnabled(enabled);
      
      if (config) {
        setConfig({ ...config, zoho_enabled: enabled });
      }

      toast({
        title: "Success",
        description: enabled ? "Auto-sync enabled" : "Auto-sync disabled",
      });

      if (enabled) {
        await fetchSyncData();
      }
    } catch (error: any) {
      console.error("Error toggling sync:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Zoho Books? You will need to reconnect to resume syncing.")) {
      return;
    }

    try {
      setIsLoading(true);
      await disconnectZoho();
      setZohoEnabled(false);
      await fetchConfig();

      toast({
        title: "Disconnected",
        description: "Zoho Books has been disconnected",
      });
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to disconnect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncOrder = async (orderId: string) => {
    try {
      setSyncingOrders(prev => new Set(prev).add(orderId));
      const result = await syncOrderToZoho(orderId);

      toast({
        title: "Sync Successful",
        description: `Order synced to Zoho. Sales Order ID: ${result.zoho_id}`,
      });

      await fetchSyncData();
    } catch (error: any) {
      console.error("Error syncing order:", error);
      toast({
        title: "Sync Failed",
        description: error?.response?.data?.message || "Failed to sync order",
        variant: "destructive",
      });
    } finally {
      setSyncingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleSyncAll = async () => {
    if (!confirm("This will attempt to sync all pending orders. Continue?")) {
      return;
    }

    try {
      setIsSyncingAll(true);
      await syncAllOrders();

      toast({
        title: "Sync Started",
        description: "All pending orders are being synced to Zoho Books",
      });

      // Refresh data after a delay
      setTimeout(() => fetchSyncData(), 2000);
    } catch (error: any) {
      console.error("Error syncing all orders:", error);
      toast({
        title: "Sync Failed",
        description: error?.response?.data?.message || "Failed to sync orders",
        variant: "destructive",
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const toggleErrorExpansion = (orderId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = () => {
    if (!config) return null;

    if (!config.has_credentials) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Not Connected
        </Badge>
      );
    }

    if (config.token_valid && config.zoho_enabled) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Connected & Active
        </Badge>
      );
    }

    if (config.token_valid && !config.zoho_enabled) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="w-3 h-3 mr-1" />
          Connected but Disabled
        </Badge>
      );
    }

    return (
      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
        <AlertCircle className="w-3 h-3 mr-1" />
        Token Expired
      </Badge>
    );
  };

  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Zoho Books Integration</h1>
            <p className="text-muted-foreground mt-2">
              Configure and manage Zoho Books connection for automated accounting
            </p>
          </div>
        </div>

        <Separator />

        {/* Integration Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ZohoLogo />
                <div>
                  <CardTitle>Zoho Books Integration</CardTitle>
                  <CardDescription>Sync orders and customers to Zoho Books</CardDescription>
                </div>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Organization Info */}
              {config?.zoho_organization_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Organization:</span>
                  <span className="font-semibold">{config.zoho_organization_name}</span>
                </div>
              )}

              {/* Token Expiry */}
              {config?.token_expiry && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Token valid until: {formatDate(config.token_expiry)}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {!config?.has_credentials ? (
                  <Button onClick={() => setShowOAuthDialog(true)}>
                    Connect Zoho Books
                  </Button>
                ) : (
                  <>
                    {config.token_valid ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={handleTestConnection}
                          disabled={isTesting}
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube2 className="w-4 h-4 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDisconnect}
                          disabled={isLoading}
                        >
                          <Power className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setShowOAuthDialog(true)}>
                        Reconnect
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings - Only show if connected */}
        {config?.has_credentials && config.token_valid && (
          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>Control automatic order synchronization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Auto-sync new orders</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically sync orders to Zoho Books when created
                  </div>
                </div>
                <Switch
                  checked={config.zoho_enabled}
                  onCheckedChange={handleToggleSync}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync Dashboard - Only show if enabled */}
        {config?.zoho_enabled && config.token_valid && (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{syncStats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Successfully Synced</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{syncStats.synced}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{syncStats.failed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{syncStats.pending}</div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Mapping Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Mapping Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Customers synced to Zoho: <span className="font-semibold text-foreground">{customerStats.synced} / {customerStats.total}</span>
                  </div>
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${customerStats.total > 0 ? (customerStats.synced / customerStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sync Activity Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Sync Activity</CardTitle>
                    <CardDescription>View and manage order synchronization status</CardDescription>
                  </div>
                  {syncStats.pending > 0 && (
                    <Button
                      onClick={handleSyncAll}
                      disabled={isSyncingAll}
                      size="sm"
                    >
                      {isSyncingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync All Pending
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Zoho Status</TableHead>
                        <TableHead>Zoho ID</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <>
                            <TableRow key={order._id}>
                              <TableCell className="font-medium">{order.order_number}</TableCell>
                              <TableCell>{order.customer_name}</TableCell>
                              <TableCell>{formatDate(order.createdAt)}</TableCell>
                              <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                              <TableCell>
                                {order.zoho_sync_status === "synced" && (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Synced
                                  </Badge>
                                )}
                                {order.zoho_sync_status === "failed" && (
                                  <Badge variant="destructive">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                                {order.zoho_sync_status === "not_synced" && (
                                  <Badge variant="secondary">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {order.zoho_salesorder_id || "-"}
                              </TableCell>
                              <TableCell>
                                {(order.zoho_sync_status === "failed" || order.zoho_sync_status === "not_synced") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSyncOrder(order._id)}
                                    disabled={syncingOrders.has(order._id)}
                                  >
                                    {syncingOrders.has(order._id) ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3" />
                                    )}
                                    <span className="ml-1">
                                      {order.zoho_sync_status === "failed" ? "Retry" : "Sync"}
                                    </span>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            {/* Error Row */}
                            {order.zoho_sync_status === "failed" && order.zoho_sync_error && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-red-50 p-0">
                                  <Collapsible
                                    open={expandedErrors.has(order._id)}
                                    onOpenChange={() => toggleErrorExpansion(order._id)}
                                  >
                                    <CollapsibleTrigger className="w-full px-4 py-2 text-left text-sm text-red-800 hover:bg-red-100 flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4" />
                                      {expandedErrors.has(order._id) ? "Hide" : "Show"} error details
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-4 py-2">
                                      <Alert variant="destructive">
                                        <AlertDescription className="text-xs">
                                          {order.zoho_sync_error}
                                        </AlertDescription>
                                      </Alert>
                                    </CollapsibleContent>
                                  </Collapsible>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* OAuth Connection Dialog */}
      <OAuthConnectionDialog
        open={showOAuthDialog}
        onOpenChange={setShowOAuthDialog}
      />

      {/* Organization Selector */}
      <OrganizationSelector
        open={showOrgSelector}
        onOpenChange={setShowOrgSelector}
        organizations={organizations}
        onSuccess={() => {
          fetchConfig();
          fetchSyncData();
        }}
      />
    </DashboardLayout>
  );
};

export default ZohoBooksIntegration;
