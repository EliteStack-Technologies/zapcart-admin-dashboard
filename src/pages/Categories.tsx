import { Plus, Search, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const Categories = () => {
  const categories = [
    { id: 1, name: "Beverages", productCount: 45, color: "#3B82F6" },
    { id: 2, name: "Snacks", productCount: 32, color: "#EF4444" },
    { id: 3, name: "Pantry", productCount: 28, color: "#10B981" },
    { id: 4, name: "Dairy", productCount: 18, color: "#F59E0B" },
    { id: 5, name: "Frozen Foods", productCount: 22, color: "#8B5CF6" },
    { id: 6, name: "Bakery", productCount: 15, color: "#EC4899" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground mt-2">
              Organize products into categories
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <div 
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: category.color }}
                    />
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
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {category.productCount} products
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Categories;
