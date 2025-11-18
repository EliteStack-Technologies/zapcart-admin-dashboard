import { useState } from "react";
import { Plus, FileText, Download, Trash2, Upload, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddFlyerDialog from "@/components/AddFlyerDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

const Flyers = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlyer, setSelectedFlyer] = useState<number | null>(null);
  const flyers = [
    { 
      id: 1, 
      name: "November Weekly Deals",
      pdfUrl: "#",
      fileSize: "2.4 MB",
      uploadedAt: "2024-11-15",
      downloads: 156
    },
    { 
      id: 2, 
      name: "Black Friday Special",
      pdfUrl: "#",
      fileSize: "3.1 MB",
      uploadedAt: "2024-11-10",
      downloads: 342
    },
    { 
      id: 3, 
      name: "Holiday Season Catalog",
      pdfUrl: "#",
      fileSize: "5.8 MB",
      uploadedAt: "2024-11-05",
      downloads: 287
    },
    { 
      id: 4, 
      name: "Fresh Produce Guide",
      pdfUrl: "#",
      fileSize: "1.9 MB",
      uploadedAt: "2024-11-01",
      downloads: 198
    },
  ];

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

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Flyers</p>
                  <p className="text-2xl font-bold text-foreground">{flyers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <Download className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                  <p className="text-2xl font-bold text-foreground">
                    {flyers.reduce((sum, f) => sum + f.downloads, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Latest Upload</p>
                  <p className="text-2xl font-bold text-foreground">
                    {flyers[0]?.uploadedAt}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flyers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flyer Name</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flyers.map((flyer) => (
                  <TableRow key={flyer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{flyer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {flyer.fileSize}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {flyer.uploadedAt}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {flyer.downloads}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            setSelectedFlyer(flyer.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
