import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Tag } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AddOfferDialog from "@/components/AddOfferDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { deleteOffer, getOfferTags } from "@/services/offersTags";

const Offers = () => {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<{
    _id: string;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // const offers = [
  //   { id: 1, name: "Summer Sale" },
  //   { id: 2, name: "Buy 2 Get 1" },
  //   { id: 3, name: "Flash Deal" },
  //   { id: 4, name: "Weekend Special" },
  //   { id: 5, name: "New Arrival" },
  //   { id: 6, name: "Clearance" },
  // ];
  const [offers, setOffers] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOfferTags();
        setOffers(data);
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };
    fetchData();
  }, []);

  const filteredOffers = offers?.filter((offer) =>
    offer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedOffer?._id) return;

    try {
      await deleteOffer(selectedOffer._id);
      
      // Update state by filtering out the deleted offer
      setOffers((prev) => prev.filter((offer) => offer._id !== selectedOffer._id));
      
      toast({
        title: "Offer deleted",
        description: "The offer tag has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete offer",
        variant: "destructive",
      });
      console.error("Error deleting offer:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedOffer(null);
    }
  };

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
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Offer
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search offers..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offers List */}
        <div className="grid grid-cols-3 gap-2">
          {filteredOffers?.length > 0 ? (
            filteredOffers?.map((offer) => (
              <Card
                key={offer.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {offer.name}
                        </p>
                    
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          setSelectedOffer(offer);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          setSelectedOffer(offer);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No offers found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialogs */}
        <AddOfferDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          setOffers={setOffers}
        />
        <AddOfferDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editingOffer={selectedOffer || undefined}
          setOffers={setOffers}
        />
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Offer Tag"
          description="Are you sure you want to delete this offer? Products using this offer will not be affected."
          onConfirm={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default Offers;
