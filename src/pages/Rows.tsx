import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { getSections, addSection, updateSection, deleteSection, swapSectionOrder } from "@/services/rows";

const Rows = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{ _id: number; name: string } | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderInputs, setOrderInputs] = useState<{ [key: string]: number }>({});

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
    },
  });

  // Filter sections based on search
  const filteredSections = sections.filter((section) =>
    section.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSections();
        const sectionsList = data?.sections || data?.data || (Array.isArray(data) ? data : []);
        // Sort sections by order field if it exists, otherwise keep original order
        const sortedSections = sectionsList.sort((a: any, b: any) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return 0;
        });
        setSections(sortedSections);
      } catch (error) {
        console.error("Error fetching sections:", error);
        toast({
          title: "Error",
          description: "Failed to load sections",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [toast]);

  useEffect(() => {
    if (selectedSection && editDialogOpen) {
      setValue("name", selectedSection.name);
    } else if (!editDialogOpen) {
      reset();
    }
  }, [selectedSection, editDialogOpen, setValue, reset]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      if (selectedSection) {
        // UPDATE MODE
        const response = await updateSection(String(selectedSection._id), { name: data.name });
        const updatedSection = response?.data || response;

        setSections((prev) =>
          prev.map((s) => (s._id === selectedSection._id ? updatedSection : s))
        );

        toast({
          title: "Section updated",
          description: "Section has been successfully updated.",
        });
        setEditDialogOpen(false);
      } else {
        // CREATE MODE
        const response = await addSection({ name: data.name });
        const newSection = response?.data || response;

        setSections((prev) => [...prev, newSection]);

        toast({
          title: "Section created",
          description: "Section has been successfully added.",
        });
        setAddDialogOpen(false);
      }

      reset();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSection?._id) return;

    try {
      await deleteSection(String(selectedSection._id));

      // Update state by filtering out the deleted section
      setSections((prev) => prev.filter((s) => s._id !== selectedSection._id));

      toast({
        title: "Section deleted",
        description: "The section has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete section",
        variant: "destructive",
      });
      console.error("Error deleting section:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedSection(null);
    }
  };

  const handleOrderChange = async (currentIndex: number, newOrder: number) => {
    if (newOrder < 1 || newOrder > filteredSections.length || newOrder === currentIndex + 1) {
      return;
    }

    const targetIndex = newOrder - 1;
    const section1 = filteredSections[currentIndex];
    const section2 = filteredSections[targetIndex];

    try {
      // Direct swap between current position and target position
      await swapSectionOrder(String(section1._id), String(section2._id));

      // Swap in local state
      setSections((prev) => {
        const newSections = [...prev];
        const idx1 = newSections.findIndex(s => s._id === section1._id);
        const idx2 = newSections.findIndex(s => s._id === section2._id);
        
        if (idx1 !== -1 && idx2 !== -1) {
          // Swap the two sections
          [newSections[idx1], newSections[idx2]] = [newSections[idx2], newSections[idx1]];
        }
        
        return newSections;
      });

      toast({
        title: "Order updated",
        description: "Section order has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update section order",
        variant: "destructive",
      });
      console.error("Error swapping section order:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Section Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage sections for product organization
            </p>
          </div>
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Section
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sections..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SI No</TableHead>
                  <TableHead>Section Name</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSections.length > 0 ? (
                  filteredSections.map((section, index) => (
                    <TableRow key={section._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{section.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={filteredSections.length}
                          value={orderInputs[section._id] ?? index + 1}
                          className="w-20"
                          onChange={(e) => {
                            const value = e.target.value;
                            setOrderInputs(prev => ({
                              ...prev,
                              [section._id]: value === '' ? '' : parseInt(value)
                            }));
                          }}
                          onBlur={(e) => {
                            const newOrder = parseInt(e.target.value);
                            if (!isNaN(newOrder) && newOrder >= 1 && newOrder <= filteredSections.length && newOrder !== index + 1) {
                              handleOrderChange(index, newOrder);
                            }
                            // Reset to actual position
                            setOrderInputs(prev => {
                              const updated = { ...prev };
                              delete updated[section._id];
                              return updated;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSection(section);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSection(section);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No sections found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Section Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Section</DialogTitle>
              <DialogDescription>
                Create a new section for product organization.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Section Name*</Label>
                  <Input
                    id="name"
                    placeholder="Section A"
                    {...register("name", { required: "Section name is required" })}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Section"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Section Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Section</DialogTitle>
              <DialogDescription>
                Update the section name.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Section Name*</Label>
                  <Input
                    id="edit-name"
                    placeholder="Section A"
                    {...register("name", { required: "Section name is required" })}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Section"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Section</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this section? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Rows;
