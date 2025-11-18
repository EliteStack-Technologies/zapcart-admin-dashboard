import { useState } from "react";
import { Plus, Upload, Edit, Trash2, Eye } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AddBannerDialog from "@/components/AddBannerDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

interface Banner {
  id: number;
  imageUrl: string;
  status: "active" | "inactive";
  createdAt: string;
}

const Banners = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<number | null>(null);
  const [banners, setBanners] = useState<Banner[]>([
    { 
      id: 1, 
      imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da",
      status: "active",
      createdAt: "2024-11-10"
    },
    { 
      id: 2, 
      imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f",
      status: "active",
      createdAt: "2024-11-08"
    },
    { 
      id: 3, 
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      status: "inactive",
      createdAt: "2024-11-05"
    },
    { 
      id: 4, 
      imageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc",
      status: "active",
      createdAt: "2024-11-01"
    },
  ]);

  const handleDelete = () => {
    toast({
      title: "Banner deleted",
      description: "The banner has been successfully removed.",
    });
    setDeleteDialogOpen(false);
    setSelectedBanner(null);
  };

  const toggleBannerStatus = (bannerId: number) => {
    setBanners(prev => prev.map(banner => 
      banner.id === bannerId 
        ? { ...banner, status: banner.status === "active" ? "inactive" as const : "active" as const }
        : banner
    ));
    
    const banner = banners.find(b => b.id === bannerId);
    const newStatus = banner?.status === "active" ? "inactive" : "active";
    
    toast({
      title: "Status updated",
      description: `Banner is now ${newStatus}.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Banners</h1>
            <p className="text-muted-foreground mt-2">
              Upload and manage promotional banners for your storefront
            </p>
          </div>
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Upload className="w-4 h-4" />
            Upload Banner
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Total Banners</p>
              <p className="text-3xl font-bold text-foreground mt-2">{banners.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Active Banners</p>
              <p className="text-3xl font-bold text-success mt-2">
                {banners.filter(b => b.status === "active").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Inactive Banners</p>
              <p className="text-3xl font-bold text-muted-foreground mt-2">
                {banners.filter(b => b.status === "inactive").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Banners Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-muted">
                <img 
                  src={banner.imageUrl}
                  alt={`Banner ${banner.id}`}
                  className="w-full h-full object-cover"
                />
                <Badge 
                  className="absolute top-4 right-4"
                  variant={banner.status === "active" ? "default" : "secondary"}
                >
                  {banner.status}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Banner #{banner.id}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {banner.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${banner.id}`} className="text-sm cursor-pointer">
                        {banner.status === "active" ? "Active" : "Inactive"}
                      </Label>
                      <Switch
                        id={`toggle-${banner.id}`}
                        checked={banner.status === "active"}
                        onCheckedChange={() => toggleBannerStatus(banner.id)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedBanner(banner.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialogs */}
        <AddBannerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Banner"
          description="Are you sure you want to delete this banner? This action cannot be undone."
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default Banners;
