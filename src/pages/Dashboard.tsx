import { useState, useEffect } from "react";
import { Package, ShoppingCart, TrendingUp, DollarSign, Activity, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getAnalyticsOverview, AnalyticsData } from "@/services/analytics";
import { format, parseISO } from "date-fns";

const Dashboard = () => {
  const { currency } = useCurrency();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAnalyticsOverview();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);
  
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      processing: "bg-purple-500",
      shipped: "bg-indigo-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">No analytics data available</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your business.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={analytics.overview.total_orders.toString()}
            icon={ShoppingCart}
            trend={`${analytics.overview.total_orders} orders`}
            trendUp={true}
          />
          <StatCard
            title="Total Revenue"
            value={`${currency?.symbol || analytics.overview.currency.symbol}${analytics.overview.total_revenue.toFixed(2)}`}
            icon={DollarSign}
            trend={`Avg: ${currency?.symbol || analytics.overview.currency.symbol}${analytics.overview.average_order_value.toFixed(2)}`}
            trendUp={true}
          />
          <StatCard
            title="Total Products"
            value={analytics.overview.total_products.toString()}
            icon={Package}
            trend={`${analytics.overview.active_products} active`}
            trendUp={true}
          />
          <StatCard
            title="Active Products"
            value={analytics.overview.active_products.toString()}
            icon={Activity}
            trend={`${analytics.overview.inactive_products} inactive`}
            trendUp={analytics.overview.active_products > analytics.overview.inactive_products}
          />
        </div>

        {/* Order Status Breakdown & Revenue Trend */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.order_status_breakdown.map((status) => (
                  <div key={status._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status._id)}`} />
                      <div>
                        <p className="font-medium text-foreground capitalize">{status._id}</p>
                        <p className="text-sm text-muted-foreground">{status.count} orders</p>
                      </div>
                    </div>
                    <span className="font-semibold text-foreground">
                      {currency?.symbol || analytics.overview.currency.symbol}{status.total_amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7-Day Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.revenue_trend_7days.map((day) => (
                  <div key={day._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">
                        {format(parseISO(day._id), "MMM dd, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">{day.order_count} orders</p>
                    </div>
                    <span className="font-semibold text-primary">
                      {currency?.symbol || analytics.overview.currency.symbol}{day.daily_revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
                {analytics.revenue_trend_7days.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No revenue data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Products & Category Performance */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.top_selling_products.slice(0, 5).map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.product_title}</p>
                        <p className="text-sm text-muted-foreground">{product.total_quantity} sold</p>
                      </div>
                    </div>
                    <span className="font-semibold text-foreground">
                      {currency?.symbol || analytics.overview.currency.symbol}{product.total_revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
                {analytics.top_selling_products.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No products sold yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.category_performance.filter(cat => cat.product_count > 0).slice(0, 5).map((category) => (
                  <div key={category._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.product_count} products
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10">
                      {category.active_products} active
                    </Badge>
                  </div>
                ))}
                {analytics.category_performance.filter(cat => cat.product_count > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No categories with products</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recent_orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>
                      {currency?.symbol || analytics.overview.currency.symbol}{order.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.order_status)}>
                        {order.order_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(parseISO(order.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
                  </TableRow>
                ))}
                {analytics.recent_orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No recent orders
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
