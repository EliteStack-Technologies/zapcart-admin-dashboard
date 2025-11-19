import { useState } from "react";
import { Plus, Search, Edit, Trash2, FolderOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AddCategoryDialog from "@/components/AddCategoryDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

const Categories = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const categories = [
    { id: 1, name: "Beverages", productCount: 45 },
    { id: 2, name: "Snacks", productCount: 32 },
    { id: 3, name: "Pantry", productCount: 28 },
    { id: 4, name: "Dairy", productCount: 18 },
    { id: 5, name: "Frozen Foods", productCount: 22 },
    { id: 6, name: "Bakery", productCount: 15 },
  ];

  const handleDelete = () => {
    toast({
      title: "Category deleted",
      description: "The category has been successfully removed.",
    });
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

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
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
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
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
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

        {/* Dialogs */}
        <AddCategoryDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Category"
          description="Are you sure you want to delete this category? Products in this category will not be deleted."
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default Categories;
