import { useState, useEffect } from "react";
import { FileText, Download, Trash2, Upload, Eye, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AddFlyerDialog from "@/components/AddFlyerDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { flyerService, Flyer } from "@/services/flyers";

const Flyers = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlyer, setSelectedFlyer] = useState<string | null>(null);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch flyers on component mount
  useEffect(() => {
    fetchFlyers();
  }, []);

  const fetchFlyers = async () => {
    try {
      setLoading(true);
      const data = await flyerService.getFlyers();
      setFlyers(data.flyers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load flyers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get the first active flyer (current flyer)
  const currentFlyer = flyers.find(f => f.status === "active") || flyers[0];

  const handleDelete = async () => {
    if (!selectedFlyer) return;
    
    try {
      setDeleting(true);
      await flyerService.deleteFlyer(selectedFlyer);
      toast({
        title: "Flyer deleted",
        description: "The flyer has been successfully removed.",
      });
      setDeleteDialogOpen(false);
      setSelectedFlyer(null);
      // Refresh flyers list
      await fetchFlyers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete flyer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleFlyerAdded = () => {
    fetchFlyers();
    setAddDialogOpen(false);
  };

  const handleStatusToggle = async (flyerId: string, currentStatus: string) => {
    try {
      setUpdatingStatus(true);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await flyerService.updateFlyerStatus(flyerId, newStatus);
      
      toast({
        title: "Status updated",
        description: `Flyer status changed to ${newStatus}.`,
      });
      
      // Refresh flyers list
      await fetchFlyers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:3000";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Flyers</h1>
            <p className="text-muted-foreground mt-2">
              Upload and manage PDF flyers and promotional materials
            </p>
          </div>
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Upload className="w-4 h-4" />
            Upload Flyer
          </Button>
        </div>

        {/* Loading State */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading flyers...</p>
            </CardContent>
          </Card>
        ) : currentFlyer ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Flyer Preview */}
                <div className="flex-shrink-0">
                  <div className="w-48 h-64 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border-2 border-primary/30 flex items-center justify-center">
                    <FileText className="w-24 h-24 text-primary/60" />
                  </div>
                </div>

                {/* Flyer Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-foreground mb-2">
                        {currentFlyer.title}
                      </h2>
                      <Badge variant={currentFlyer.status === "active" ? "default" : "secondary"}>
                        {currentFlyer.status}
                      </Badge>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">File Size</p>
                      <p className="text-lg font-semibold text-foreground">{formatFileSize(currentFlyer.file_size)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Upload Date</p>
                      <p className="text-lg font-semibold text-foreground">{formatDate(currentFlyer.createdAt)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Valid From</p>
                      <p className="text-lg font-semibold text-foreground">
                        {currentFlyer.valid_from ? formatDate(currentFlyer.valid_from) : "Not Set"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Valid Until</p>
                      <p className="text-lg font-semibold text-foreground">
                        {currentFlyer.valid_until ? formatDate(currentFlyer.valid_until) : "Not Set"}
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="status-toggle" className="text-base font-medium">
                          Flyer Status
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {currentFlyer.status === "active" 
                            ? "This flyer is currently visible to customers" 
                            : "This flyer is currently hidden from customers"}
                        </p>
                      </div>
                      <Switch
                        id="status-toggle"
                        checked={currentFlyer.status === "active"}
                        onCheckedChange={() => handleStatusToggle(currentFlyer._id, currentFlyer.status)}
                        disabled={updatingStatus}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button 
                      className="gap-2"
                      onClick={() => window.open(`${getBaseUrl()}${currentFlyer.pdf_url}`, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => window.open(`${getBaseUrl()}${currentFlyer.pdf_url}`, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      <Upload className="w-4 h-4" />
                      Replace
                    </Button>
          
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No flyer uploaded yet</p>
              <Button 
                className="gap-2"
                onClick={() => setAddDialogOpen(true)}
              >
                <Upload className="w-4 h-4" />
                Upload Flyer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <AddFlyerDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen}
          onFlyerAdded={handleFlyerAdded}
        />
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Flyer"
          description="Are you sure you want to delete this flyer? This action cannot be undone."
          onConfirm={handleDelete}
          loading={deleting}
        />
      </div>
    </DashboardLayout>
  );
};

export default Flyers;
