import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Truck, Phone, Mail, CheckCircle, Clock, XCircle, List } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddDeliveryAgentDialog from "@/components/AddDeliveryAgentDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { 
  deleteDeliveryAgent, 
  getDeliveryAgents, 
  getDeliveryStats, 
  getAllDeliveries,
  DeliveryAgent 
} from "@/services/deliveryAgents";
import { Order } from "@/services/orders";
import { format } from "date-fns";

const DeliveryAgents = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<DeliveryAgent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("agents");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agentsData, statsData] = await Promise.all([
        getDeliveryAgents(),
        getDeliveryStats()
      ]);
      setAgents(Array.isArray(agentsData) ? agentsData : agentsData?.deliveryAgents || agentsData?.data || []);
      setStats(statsData);
    } catch (error: any) {
      console.error("Error fetching delivery data:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load delivery agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async (search = "") => {
    try {
      setDeliveriesLoading(true);
      const data = await getAllDeliveries({ search });
      setDeliveries(data.deliveries || []);
    } catch (error: any) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "deliveries") {
      fetchDeliveries(searchQuery);
    }
  }, [activeTab, searchQuery]);

  const filteredAgents = agents?.filter((agent) =>
    agent?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent?.phone_number?.includes(searchQuery) ||
    agent?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedAgent?._id) return;

    try {
      await deleteDeliveryAgent(selectedAgent._id);
      setAgents((prev) => prev.filter((agent) => agent._id !== selectedAgent._id));
      toast({
        title: "Agent deleted",
        description: "The delivery agent has been successfully removed.",
      });
      fetchData(); // Refresh stats
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete delivery agent",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedAgent(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 flex flex-col h-full container max-w-7xl mx-auto py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Truck className="w-8 h-8 text-primary" /> Delivery Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor your delivery fleet and track orders
            </p>
          </div>
          <Button className="gap-2 shrink-0 shadow-sm transition-all" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-5 h-5 shrink-0" />
            <span className="font-semibold tracking-wide">Add Agent</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Truck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_delivery_agents || 0} / {stats?.total_delivery_agents || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Personnel currently active</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.delivered_orders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Delivery</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.pending_delivery_orders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders currently in transit</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.cancelled_delivery_orders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Failed delivery attempts</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabsList className="bg-muted/50 border border-border/50">
              <TabsTrigger value="agents" className="gap-2">
                <Truck className="w-4 h-4" /> Agents
              </TabsTrigger>
              <TabsTrigger value="deliveries" className="gap-2">
                <List className="w-4 h-4" /> Deliveries
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 w-full sm:max-w-xs relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "agents" ? "Search agents..." : "Search orders..."}
                className="pl-10 h-10 border-muted-foreground/20 focus-visible:ring-primary/20 bg-muted/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="agents" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents?.length > 0 ? (
                  filteredAgents?.map((agent) => (
                    <Card
                      key={agent._id}
                      className="hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden group hover:border-primary/20 flex flex-col"
                    >
                      <CardContent className="p-0 flex-1 flex flex-col">
                        <div className="p-5 flex-1 relative flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                <span className="text-xl font-bold text-primary">
                                  {agent.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0 pr-2">
                                <h3 className="font-semibold text-lg text-foreground truncate">{agent.name}</h3>
                                <Badge variant={agent.status === "active" ? "default" : "secondary"} className="mt-1 shadow-none font-medium px-2 py-0 border border-border/50 text-[10px] tracking-wider uppercase">
                                  {agent.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 mt-auto w-full">
                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground/90 bg-muted/20 p-2 rounded-md truncate max-w-full">
                              <Phone className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                              <span className="truncate min-w-0 font-medium">{agent.phone_number}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground/90 bg-muted/20 p-2 rounded-md truncate max-w-full">
                              <Mail className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                              <span className="truncate min-w-0">{agent.email}</span>
                            </div>
                            {(agent.vehicle_type || agent.vehicle_number) && (
                              <div className="flex items-center gap-2.5 text-sm text-muted-foreground/90 bg-muted/20 p-2 rounded-md truncate max-w-full">
                                <Truck className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                                <span className="truncate min-w-0 font-medium">
                                  {agent.vehicle_type} {agent.vehicle_type && agent.vehicle_number ? '-' : ''} {agent.vehicle_number}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2.5 text-sm text-green-600 bg-green-50/50 p-2 rounded-md truncate max-w-full border border-green-100/50">
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              <span className="truncate min-w-0 font-bold">
                                {agent.delivered_orders_count || 0} Deliveries Completed
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-border/50 p-3 bg-muted/20 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-9 gap-1 shadow-sm font-medium"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 gap-1 shadow-sm font-medium"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full">
                    <Card className="border-dashed border-2 shadow-none">
                      <CardContent className="flex flex-col items-center justify-center p-12 py-20 text-center">
                        <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                          <Truck className="w-10 h-10 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No delivery agents found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          {searchQuery ? "We couldn't find any delivery agents matching your search." : "You haven't added any delivery agents yet. Create one to get started."}
                        </p>
                        {searchQuery ? (
                          <Button variant="outline" onClick={() => setSearchQuery("")}>
                            Clear Search
                          </Button>
                        ) : (
                          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add First Agent
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="mt-0">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[120px] font-semibold">Order #</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Delivery Agent</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold px-4">Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveriesLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading deliveries...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : deliveries.length > 0 ? (
                      deliveries.map((order) => (
                        <TableRow key={order._id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="font-bold text-primary">{order.order_number}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.customer_name}</span>
                              <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {typeof order.delivery_agent_id !== 'string' && order.delivery_agent_id ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                                    {(order.delivery_agent_id as any).name?.charAt(0) || 'A'}
                                  </div>
                                  <span className="font-medium">{(order.delivery_agent_id as any).name}</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground italic text-sm">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`
                                font-medium transition-colors border-none
                                ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                  order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                  'bg-blue-100 text-blue-700'}
                              `}
                            >
                              {order.order_status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(order.updatedAt), "MMM d, yyyy HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">
                          No deliveries found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddDeliveryAgentDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={fetchData}
        />
        {selectedAgent && (
          <AddDeliveryAgentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            editingAgent={selectedAgent}
            onSuccess={fetchData}
          />
        )}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Delivery Agent"
          description="Are you sure you want to delete this delivery agent? This action cannot be undone."
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default DeliveryAgents;

