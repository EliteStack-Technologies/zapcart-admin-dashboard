import { useEffect, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import AddBannerDialog from "@/components/AddBannerDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { changeBannerStatus, getBanners, deleteBanner } from "@/services/banners";

interface Banner {
  _id: string;
  image_url: string;
  status: "active" | "inactive";
  createdAt: string;
}

const Banners = () => {
  const { toast } = useToast();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBanners();
        setBanners(data);
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };
    fetchData();
  }, []);

  // ---------------------------
  // DELETE BANNER
  // ---------------------------
  const handleDelete = async () => {
    if (!selectedBanner?._id) return;

    try {
      await deleteBanner(selectedBanner._id);

      // Remove banner from state
      setBanners((prev) => prev.filter((b) => b._id !== selectedBanner._id));

      toast({
        title: "Banner deleted",
        description: "The banner has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete banner.",
        variant: "destructive",
      });
    }

    setDeleteDialogOpen(false);
    setSelectedBanner(null);
  };

  // ---------------------------
  // TOGGLE STATUS
  // ---------------------------
  const toggleBannerStatus = async (bannerId: string) => {
    try {
      await changeBannerStatus(bannerId);

      setBanners((prev) =>
        prev.map((banner) =>
          banner._id === bannerId
            ? {
                ...banner,
                status: banner.status === "active" ? "inactive" : "active",
              }
            : banner
        )
      );

      const updated = banners.find((b) => b._id === bannerId);

      toast({
        title: "Status updated",
        description: `Banner is now ${updated?.status === "active" ? "inactive" : "active"}.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to change banner status",
        variant: "destructive",
      });
    }
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
              <p className="text-3xl font-bold mt-2">{banners.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Active Banners</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {banners.filter((b) => b.status === "active").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Inactive Banners</p>
              <p className="text-3xl font-bold text-muted-foreground mt-2">
                {banners.filter((b) => b.status === "inactive").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Banners Grid */}
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          {banners.map((banner) => (
            <Card key={banner._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square bg-muted">
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${banner.image_url}`}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />

                <Badge
                  className="absolute top-4 right-4 capitalize"
                  variant={banner.status === "active" ? "default" : "secondary"}
                >
                  {banner.status}
                </Badge>
              </div>

              <CardContent className="p-3">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{banner.createdAt}</p>

                  <Switch
                    checked={banner.status === "active"}
                    onCheckedChange={() => toggleBannerStatus(banner._id)}
                  />
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => {
                      setSelectedBanner(banner);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialogs */}
        <AddBannerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} setBanners={setBanners} />

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
