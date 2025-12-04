import { Package, Tag, Image, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";

const Dashboard = () => {
  const { currency } = useCurrency();
  
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
            title="Total Products"
            value="156"
            icon={Package}
            trend="+12% from last month"
            trendUp={true}
          />
          <StatCard
            title="Active Offers"
            value="8"
            icon={Tag}
            trend="+2 new this week"
            trendUp={true}
          />
          <StatCard
            title="Categories"
            value="24"
            icon={TrendingUp}
            trend="Stable"
            trendUp={true}
          />
          <StatCard
            title="Active Banners"
            value="5"
            icon={Image}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Premium Coffee Beans", price: "24.99", status: "Active" },
                  { name: "Organic Green Tea", price: "18.50", status: "Active" },
                  { name: "Dark Chocolate Bar", price: "5.99", status: "Offer" },
                  { name: "Natural Honey Jar", price: "12.99", status: "Active" },
                ].map((product, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{currency?.symbol || '$'}{product.price}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.status === "Offer" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-success/10 text-success"
                    }`}>
                      {product.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Summer Sale", discount: "25% OFF", expires: "In 5 days" },
                  { name: "Buy 2 Get 1", discount: "3 for 2", expires: "In 12 days" },
                  { name: "Flash Deal", discount: "50% OFF", expires: "Today" },
                  { name: "Weekend Special", discount: "15% OFF", expires: "In 3 days" },
                ].map((offer, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{offer.name}</p>
                      <p className="text-sm text-muted-foreground">{offer.discount}</p>
                    </div>
                    <span className="text-xs font-medium text-warning">
                      {offer.expires}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
