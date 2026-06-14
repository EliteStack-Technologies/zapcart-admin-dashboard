import { useEffect, useState } from "react";
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
import { createTable, updateTable, RestaurantTable } from "@/services/tables";

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingTable?: RestaurantTable | null;
}

const AddTableDialog = ({ open, onOpenChange, onSuccess, editingTable }: AddTableDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { number: "", label: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        number: editingTable?.number || "",
        label: editingTable?.label || "",
      });
    }
  }, [open, editingTable, reset]);

  const onSubmit = async (data: { number: string; label: string }) => {
    setLoading(true);
    const payload = { number: data.number.trim(), label: data.label?.trim() || undefined };

    try {
      if (editingTable) {
        await updateTable(editingTable._id, payload);
        toast({ title: "Table updated", description: `Table ${payload.number} has been updated.` });
      } else {
        const res = await createTable(payload);
        toast({ title: "Table created", description: `Table ${payload.number} has been added.` });
        if (res?.mint_warning) {
          toast({
            title: "QR not generated",
            description: res.mint_warning,
            variant: "destructive",
          });
        }
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save table",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTable ? "Edit Table" : "Add Table"}</DialogTitle>
          <DialogDescription>
            {editingTable
              ? "Update this table's number or label."
              : "Declare a new table. A QR code is generated automatically when WhatsApp QR is enabled."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="number">Table Number*</Label>
              <Input
                id="number"
                placeholder="e.g. 5"
                {...register("number", { required: "Table number is required" })}
              />
              {errors.number && (
                <p className="text-xs text-destructive">{errors.number.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input id="label" placeholder="e.g. Patio 5" {...register("label")} />
              <p className="text-xs text-muted-foreground">
                A friendly name shown on the printable signage.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingTable ? "Update Table" : "Add Table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTableDialog;
