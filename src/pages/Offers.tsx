import { Plus, Search, Edit, Trash2, Tag } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Offers = () => {
  const offers = [
    { 
      id: 1, 
      name: "Summer Sale", 
      colorCode: "#3B82F6",
      discount: "25% OFF",
      activeProducts: 12,
      startDate: "2024-06-01",
      endDate: "2024-08-31"
    },
    { 
      id: 2, 
      name: "Buy 2 Get 1", 
      colorCode: "#10B981",
      discount: "3 for 2",
      activeProducts: 8,
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    },
    { 
      id: 3, 
      name: "Flash Deal", 
      colorCode: "#EF4444",
      discount: "50% OFF",
      activeProducts: 5,
      startDate: "2024-11-15",
      endDate: "2024-11-20"
    },
    { 
      id: 4, 
      name: "Weekend Special", 
      colorCode: "#F59E0B",
      discount: "15% OFF",
      activeProducts: 15,
      startDate: "2024-11-01",
      endDate: "2024-11-30"
    },
    { 
      id: 5, 
      name: "New Arrival", 
      colorCode: "#8B5CF6",
      discount: "10% OFF",
      activeProducts: 20,
      startDate: "2024-10-01",
      endDate: "2024-12-31"
    },
    { 
      id: 6, 
      name: "Clearance", 
      colorCode: "#EC4899",
      discount: "Up to 70% OFF",
      activeProducts: 18,
      startDate: "2024-09-01",
      endDate: "2024-12-31"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Offer Tags</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage promotional offer tags
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Offer
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search offers..."
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offers Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${offer.colorCode}20` }}
                    >
                      <Tag className="w-6 h-6" style={{ color: offer.colorCode }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {offer.name}
                      </h3>
                      <Badge 
                        className="mt-1"
                        style={{ 
                          backgroundColor: `${offer.colorCode}20`,
                          color: offer.colorCode,
                          border: 'none'
                        }}
                      >
                        {offer.discount}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active on products:</span>
                    <span className="font-medium text-foreground">{offer.activeProducts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Start date:</span>
                    <span className="font-medium text-foreground">{offer.startDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">End date:</span>
                    <span className="font-medium text-foreground">{offer.endDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Offers;
