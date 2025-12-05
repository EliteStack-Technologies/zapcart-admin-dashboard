import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addOffers, updateOffer } from "@/services/offersTags";

interface AddOfferDialogProps {
  open: boolean;
  setOffers?: any;
  onOpenChange: (open: boolean) => void;
  editingOffer?: {
    _id: string;
    name: string;
    color?: string;
  };
}

const AddOfferDialog = ({ open, onOpenChange, editingOffer, setOffers }: AddOfferDialogProps) => {
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState("#3B82F6");

  const presetColors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
    "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      offerName: editingOffer?.name || "",
    },
  });

  // Load editing values when dialog opens
  useEffect(() => {
    if (editingOffer) {
      reset({ offerName: editingOffer.name });
      setSelectedColor(editingOffer.color || "#3B82F6");
    }
  }, [editingOffer, reset]);

const onSubmit = async (data: any) => {
  const payload = {
    name: data.offerName,
    color_code: selectedColor,
  };

  try {
    let response;

    if (editingOffer) {
      // UPDATE MODE
      response = await updateOffer(editingOffer._id, payload);
      const updatedOffer = response?.data;

      if (!updatedOffer?._id) {
        console.error("Updated offer missing _id:", updatedOffer);
        return;
      }

      // Update the offers list with the updated offer
      if (setOffers) {
        setOffers((prev: any[]) =>
          prev.map((o) =>
            String(o._id) === String(updatedOffer._id) ? updatedOffer : o
          )
        );
      }

      toast({
        title: "Offer Updated",
        description: "Your offer has been successfully updated.",
      });
    } else {
      // CREATE MODE
      response = await addOffers(payload);
      const newOffer = response?.data?.data || response?.data;

      // Add new offer to the list
      if (setOffers) {
        setOffers((prev: any[]) => [...prev, newOffer]);
      }

      toast({
        title: "Offer Created",
        description: "Your new offer has been created.",
      });
    }

    reset();
    onOpenChange(false);
  } catch (error: any) {
    console.error("Error:", error);
    toast({
      title: "Error",
      description: error.response?.data?.message || "Something went wrong",
      variant: "destructive",
    });
  }
};


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingOffer ? "Edit Offer" : "Create Offer Tag"}</DialogTitle>
          <DialogDescription>
            {editingOffer
              ? `Edit offer #${editingOffer._id}.`
              : "Create a new promotional offer tag."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">

            {/* Offer Name */}
            <div className="space-y-2">
              <Label htmlFor="offerName">Offer Name*</Label>
              <Input
                id="offerName"
                placeholder="Summer Sale"
                {...register("offerName", { required: "Offer name is required" })}
              />
              {errors.offerName && (
                <p className="text-xs text-destructive">{errors.offerName.message}</p>
              )}
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
              <Label>Tag Color*</Label>
              <div className="grid grid-cols-8 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Custom color */}
              <div className="flex items-center gap-3 mt-3">
                <Label htmlFor="customColor" className="text-sm">Custom:</Label>
                <Input
                  id="customColor"
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{selectedColor}</span>
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingOffer ? "Update Offer" : "Create Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOfferDialog;
