import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, FolderOpen, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AddCategoryDialog from "@/components/AddCategoryDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { getCategory, deleteCategory } from "@/services/category";

const Categories = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ _id: number; name: string; productCount: number } | null>(null);
  const [categories,setCategories]=useState([])
  const [loading, setLoading] = useState(true);
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const data = await getCategory();
          console.log("Categories data:", data);
          setCategories(data);
        } catch (error) {
          console.error("Error fetching categories:", error);
          toast({
            title: "Error",
            description: "Failed to load categories",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);


  const handleDelete = async () => {
    if (!selectedCategory?._id) return;

    try {
      await deleteCategory(String(selectedCategory._id));
      
      // Update state by filtering out the deleted category
      setCategories((prev) => prev.filter((cat) => cat._id !== selectedCategory._id));
      
      toast({
        title: "Category deleted",
        description: "The category has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
      console.error("Error deleting category:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleViewProducts = async (category: any) => {
    navigate(`/categories/${category._id}/products`);
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
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first category
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
            <Card key={category._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  {category.image || category.image_url ? (
                    <img 
                      src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${category.image}`} 
                      alt={category.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setSelectedCategory(category);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setSelectedCategory(category);
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
                {/* <p className="text-sm text-muted-foreground mb-3">
                  {category.productCount || 0} products
                </p> */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => handleViewProducts(category)}
                >
                  <Eye className="w-4 h-4" />
                  View Products
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {/* Dialogs */}
        <AddCategoryDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} setCategories={setCategories}/>
        <AddCategoryDialog 
          open={editDialogOpen} 
          setCategories={setCategories}
          onOpenChange={setEditDialogOpen}
          editingCategory={selectedCategory || undefined}
        />
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
