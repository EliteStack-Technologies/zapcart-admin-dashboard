import { useState, useEffect, type ReactNode } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  TestTube2,
  Power,
  Store,
  Copy,
  Download,
  Upload,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getPosConfig,
  connectPos,
  testPosConnection,
  updatePosConfig,
  disconnectPos,
  getOrdersWithPosStatus,
  getPosSyncStats,
  pushOrderToPos,
  pushAllOrdersToPos,
  pullOrderStatusFromPos,
  pullAllStatusesFromPos,
  type PosConfig,
  type PosProvider,
  type PosStore,
  type OrderWithPos,
  type PosSyncStats,
} from "@/services/posIntegration";

const PROVIDERS: { value: PosProvider; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "clover", label: "Clover" },
  { value: "petpooja", label: "Petpooja" },
  { value: "posist", label: "Posist" },
  { value: "custom", label: "Custom / Other" },
];

const emptyStats: PosSyncStats = {
  summary: { total_orders: 0, synced: 0, failed: 0, pending: 0, sync_rate: "0%" },
  recent_syncs: [],
  recent_failures: [],
};

const PosIntegration = () => {
  const { toast } = useToast();

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isPushingAll, setIsPushingAll] = useState(false);
  const [isPullingAll, setIsPullingAll] = useState(false);

  const [config, setConfig] = useState<PosConfig | null>(null);
  const [stores, setStores] = useState<PosStore[]>([]);

  // Connect form
  const [provider, setProvider] = useState<PosProvider>("square");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  // Sync dashboard
  const [orders, setOrders] = useState<OrderWithPos[]>([]);
  const [syncStats, setSyncStats] = useState<PosSyncStats>(emptyStats);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyOrders, setBusyOrders] = useState<Set<string>>(new Set());
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (config?.pos_enabled && config.credentials_valid) {
      fetchSyncData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchConfig = async () => {
    try {
      setIsFetching(true);
      const data = await getPosConfig();
      setConfig(data);
      if (data.provider) setProvider(data.provider);
      if (data.api_base_url) setApiBaseUrl(data.api_base_url);

      if (data.has_credentials && data.credentials_valid && data.pos_enabled) {
        await fetchSyncData();
      }
    } catch (error) {
      console.error("Error fetching POS config:", error);
      toast({
        title: "Error",
        description: "Failed to load POS configuration",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const fetchSyncData = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        getPosSyncStats().catch(() => emptyStats),
        getOrdersWithPosStatus(currentPage, 20).catch(() => ({
          orders: [],
          totalPages: 1,
        })),
      ]);
      setSyncStats(statsData);
      setOrders(ordersData.orders || []);
      setTotalPages(ordersData.totalPages || 1);
    } catch (error) {
      console.error("Error fetching POS sync data:", error);
    }
  };

  const handleConnect = async () => {
    if (!apiBaseUrl.trim() || !apiKey.trim()) {
      toast({
        title: "Missing details",
        description: "API base URL and API key are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const data = await connectPos({
        provider,
        api_base_url: apiBaseUrl.trim(),
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim() || undefined,
      });
      setConfig(data);
      setApiKey("");
      setApiSecret("");
      toast({
        title: "Connected",
        description: "POS credentials saved. Test the connection to select a store.",
      });
      await handleTestConnection();
    } catch (error: any) {
      console.error("Error connecting POS:", error);
      toast({
        title: "Connection Failed",
        description:
          error?.response?.data?.message || "Failed to save POS credentials",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      const result = await testPosConnection();
      setStores(result.stores || []);
      if (result.stores && result.stores.length > 0) {
        toast({
          title: "Connection OK",
          description: `Found ${result.stores.length} store(s). Select one below.`,
        });
      } else {
        toast({
          title: "No Stores Found",
          description: "Credentials are valid but no stores were returned.",
        });
      }
      await fetchConfig();
    } catch (error: any) {
      console.error("Error testing POS connection:", error);
      toast({
        title: "Connection Failed",
        description:
          error?.response?.data?.message || "Could not reach the POS API",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSelectStore = async (storeId: string) => {
    const store = stores.find((s) => s.store_id === storeId);
    try {
      setIsSaving(true);
      const data = await updatePosConfig({
        store_id: storeId,
        store_name: store?.name,
      });
      setConfig(data);
      toast({ title: "Store selected", description: store?.name });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to select store",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (
    key: "pos_enabled" | "auto_push_orders" | "auto_pull_status",
    value: boolean
  ) => {
    try {
      setIsSaving(true);
      const data = await updatePosConfig({ [key]: value });
      setConfig(data);
      if (value && key === "pos_enabled") await fetchSyncData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Disconnect the POS? Stored credentials will be removed and you'll need to reconnect."
      )
    ) {
      return;
    }
    try {
      setIsSaving(true);
      await disconnectPos();
      setStores([]);
      await fetchConfig();
      toast({ title: "Disconnected", description: "POS has been disconnected" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to disconnect",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const withBusy = async (orderId: string, fn: () => Promise<void>) => {
    setBusyOrders((prev) => new Set(prev).add(orderId));
    try {
      await fn();
    } finally {
      setBusyOrders((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handlePushOrder = (orderId: string) =>
    withBusy(orderId, async () => {
      try {
        const result = await pushOrderToPos(orderId);
        toast({
          title: "Order Pushed",
          description: `Sent to POS. POS Order ID: ${result?.pos_order_id ?? "—"}`,
        });
        await fetchSyncData();
      } catch (error: any) {
        toast({
          title: "Push Failed",
          description:
            error?.response?.data?.message || "Failed to push order to POS",
          variant: "destructive",
        });
      }
    });

  const handlePullOrder = (orderId: string) =>
    withBusy(orderId, async () => {
      try {
        const result = await pullOrderStatusFromPos(orderId);
        toast({
          title: "Status Updated",
          description: `POS status: ${result?.pos_status ?? "refreshed"}`,
        });
        await fetchSyncData();
      } catch (error: any) {
        toast({
          title: "Refresh Failed",
          description:
            error?.response?.data?.message || "Failed to pull status from POS",
          variant: "destructive",
        });
      }
    });

  const handlePushAll = async () => {
    if (!confirm("Push all pending orders to the POS?")) return;
    try {
      setIsPushingAll(true);
      await pushAllOrdersToPos();
      toast({
        title: "Push Started",
        description: "All pending orders are being pushed to the POS",
      });
      setTimeout(fetchSyncData, 2000);
    } catch (error: any) {
      toast({
        title: "Push Failed",
        description: error?.response?.data?.message || "Failed to push orders",
        variant: "destructive",
      });
    } finally {
      setIsPushingAll(false);
    }
  };

  const handlePullAll = async () => {
    try {
      setIsPullingAll(true);
      await pullAllStatusesFromPos();
      toast({
        title: "Sync Started",
        description: "Pulling the latest order statuses from the POS",
      });
      setTimeout(fetchSyncData, 2000);
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error?.response?.data?.message || "Failed to pull statuses",
        variant: "destructive",
      });
    } finally {
      setIsPullingAll(false);
    }
  };

  const copyWebhook = () => {
    if (!config?.webhook_url) return;
    navigator.clipboard.writeText(config.webhook_url);
    toast({ title: "Copied", description: "Webhook URL copied to clipboard" });
  };

  const toggleErrorExpansion = (orderId: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const formatDate = (dateString?: string) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

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
    if (config.credentials_valid && config.pos_enabled) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Connected & Active
        </Badge>
      );
    }
    if (config.credentials_valid && !config.pos_enabled) {
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
        Credentials Invalid
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
            <h1 className="text-4xl font-bold text-foreground">POS Integration</h1>
            <p className="text-muted-foreground mt-2">
              Connect a third-party POS, push orders to it, and keep order
              statuses in sync with ZapCart
            </p>
          </div>
        </div>

        <Separator />

        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Store className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>POS Connection</CardTitle>
                  <CardDescription>
                    Manage your point-of-sale connection
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {config?.store_name && (
              <div className="flex items-center gap-2 text-sm">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Store:</span>
                <span className="font-semibold">{config.store_name}</span>
              </div>
            )}
            {config?.last_synced_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last synced: {formatDate(config.last_synced_at)}</span>
              </div>
            )}

            {!config?.has_credentials ? (
              /* Connect form */
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>POS Provider</Label>
                    <Select
                      value={provider}
                      onValueChange={(v) => setProvider(v as PosProvider)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>API Base URL</Label>
                    <Input
                      placeholder="https://api.your-pos.com"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="Your POS API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Secret (optional)</Label>
                    <Input
                      type="password"
                      placeholder="Your POS API secret"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleConnect} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect POS"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 pt-2">
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
                  disabled={isSaving}
                >
                  <Power className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            )}

            {/* Store selector (after a successful test) */}
            {config?.has_credentials && stores.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label>Select Store / Location</Label>
                <Select
                  value={config.store_id}
                  onValueChange={handleSelectStore}
                >
                  <SelectTrigger className="md:w-1/2">
                    <SelectValue placeholder="Choose a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.store_id} value={s.store_id}>
                        {s.name}
                        {s.address ? ` — ${s.address}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Settings */}
        {config?.has_credentials && config.credentials_valid && (
          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>
                Control how orders flow between ZapCart and the POS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                title="Enable POS integration"
                description="Master switch for all POS syncing"
                checked={!!config.pos_enabled}
                disabled={isSaving}
                onChange={(v) => handleToggle("pos_enabled", v)}
              />
              <ToggleRow
                title="Auto-push new orders"
                description="Send new ZapCart orders to the POS automatically"
                checked={!!config.auto_push_orders}
                disabled={isSaving || !config.pos_enabled}
                onChange={(v) => handleToggle("auto_push_orders", v)}
              />
              <ToggleRow
                title="Auto-pull status updates"
                description="Update ZapCart order status when the POS changes it"
                checked={!!config.auto_pull_status}
                disabled={isSaving || !config.pos_enabled}
                onChange={(v) => handleToggle("auto_pull_status", v)}
              />

              {config.webhook_url && (
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm font-medium">Status Webhook URL</div>
                  <p className="text-sm text-muted-foreground">
                    Configure your POS to call this URL on every order status
                    change for real-time updates.
                  </p>
                  <div className="flex gap-2">
                    <Input readOnly value={config.webhook_url} />
                    <Button variant="outline" size="icon" onClick={copyWebhook}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sync Dashboard */}
        {config?.pos_enabled && config.credentials_valid && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Total Orders"
                value={syncStats.summary.total_orders}
                icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Synced"
                value={syncStats.summary.synced}
                valueClass="text-green-600"
                icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                hint={`Sync rate: ${syncStats.summary.sync_rate}`}
              />
              <StatCard
                title="Failed"
                value={syncStats.summary.failed}
                valueClass="text-red-600"
                icon={<TrendingDown className="h-4 w-4 text-red-600" />}
              />
              <StatCard
                title="Pending"
                value={syncStats.summary.pending}
                valueClass="text-yellow-600"
                icon={<Clock className="h-4 w-4 text-yellow-600" />}
              />
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle>Order Sync Status</CardTitle>
                    <CardDescription>
                      Push orders to the POS and pull back their latest status
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePullAll}
                      disabled={isPullingAll}
                    >
                      {isPullingAll ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Pull Statuses
                    </Button>
                    <Button size="sm" onClick={handlePushAll} disabled={isPushingAll}>
                      {isPushingAll ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Push Pending
                    </Button>
                  </div>
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
                        <TableHead>Sync</TableHead>
                        <TableHead>POS Status</TableHead>
                        <TableHead>POS Order ID</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center text-muted-foreground"
                          >
                            No orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <>
                            <TableRow key={order._id}>
                              <TableCell className="font-medium">
                                {order.order_number}
                              </TableCell>
                              <TableCell>{order.customer_name}</TableCell>
                              <TableCell>{formatDate(order.createdAt)}</TableCell>
                              <TableCell>
                                {order.total_amount?.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {order.pos_sync_status === "synced" && (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Synced
                                  </Badge>
                                )}
                                {order.pos_sync_status === "failed" && (
                                  <Badge variant="destructive">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                                {order.pos_sync_status === "not_synced" && (
                                  <Badge variant="secondary">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {order.pos_status ? (
                                  <Badge variant="outline" className="capitalize">
                                    {order.pos_status}
                                  </Badge>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell>{order.pos_order_id || "—"}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {(order.pos_sync_status === "failed" ||
                                    order.pos_sync_status === "not_synced") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePushOrder(order._id)}
                                      disabled={busyOrders.has(order._id)}
                                      title="Push to POS"
                                    >
                                      {busyOrders.has(order._id) ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Upload className="w-3 h-3" />
                                      )}
                                      <span className="ml-1">
                                        {order.pos_sync_status === "failed"
                                          ? "Retry"
                                          : "Push"}
                                      </span>
                                    </Button>
                                  )}
                                  {order.pos_sync_status === "synced" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handlePullOrder(order._id)}
                                      disabled={busyOrders.has(order._id)}
                                      title="Pull latest status"
                                    >
                                      {busyOrders.has(order._id) ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <RefreshCw className="w-3 h-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            {order.pos_sync_status === "failed" &&
                              order.pos_sync_error && (
                                <TableRow>
                                  <TableCell colSpan={8} className="bg-red-50 p-0">
                                    <Collapsible
                                      open={expandedErrors.has(order._id)}
                                      onOpenChange={() =>
                                        toggleErrorExpansion(order._id)
                                      }
                                    >
                                      <CollapsibleTrigger className="w-full px-4 py-2 text-left text-sm text-red-800 hover:bg-red-100 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {expandedErrors.has(order._id)
                                          ? "Hide"
                                          : "Show"}{" "}
                                        error details
                                      </CollapsibleTrigger>
                                      <CollapsibleContent className="px-4 py-2">
                                        <Alert variant="destructive">
                                          <AlertDescription className="text-xs">
                                            {order.pos_sync_error}
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
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
    </DashboardLayout>
  );
};

// ---- small presentational helpers ----

const ToggleRow = ({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border p-4">
    <div className="space-y-0.5">
      <div className="text-base font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

const StatCard = ({
  title,
  value,
  icon,
  valueClass,
  hint,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  valueClass?: string;
  hint?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${valueClass ?? ""}`}>{value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent>
  </Card>
);

export default PosIntegration;
