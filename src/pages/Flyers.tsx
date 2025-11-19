import { useState } from "react";
import { FileText, Download, Trash2, Upload, Eye } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddFlyerDialog from "@/components/AddFlyerDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

const Flyers = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlyer, setSelectedFlyer] = useState<number | null>(null);
  
  // Single flyer state
  const [currentFlyer, setCurrentFlyer] = useState({
    id: 1,
    name: "November Weekly Deals",
    pdfUrl: "#",
    fileSize: "2.4 MB",
    uploadedAt: "2024-11-15",
    downloads: 156
  });

  const handleDelete = () => {
    toast({
      title: "Flyer deleted",
      description: "The flyer has been successfully removed.",
    });
    setDeleteDialogOpen(false);
    setSelectedFlyer(null);
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

   
        {/* Current Flyer Display */}
        {currentFlyer ? (
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
                        {currentFlyer.name}
                      </h2>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">File Size</p>
                      <p className="text-lg font-semibold text-foreground">{currentFlyer.fileSize}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Upload Date</p>
                      <p className="text-lg font-semibold text-foreground">{currentFlyer.uploadedAt}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Downloads</p>
                      <p className="text-lg font-semibold text-foreground">{currentFlyer.downloads}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button variant="outline" className="gap-2">
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
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => {
                        setSelectedFlyer(currentFlyer.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                      Delete
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
        <AddFlyerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Flyer"
          description="Are you sure you want to delete this flyer? This action cannot be undone."
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default Flyers;
