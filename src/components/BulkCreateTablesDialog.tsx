import { useEffect, useState } from "react";
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
import { bulkCreateTables } from "@/services/tables";

interface BulkCreateTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const BulkCreateTablesDialog = ({ open, onOpenChange, onSuccess }: BulkCreateTablesDialogProps) => {
  const { toast } = useToast();
  const [count, setCount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setCount("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(count, 10);
    if (!Number.isInteger(n) || n < 1 || n > 500) {
      toast({
        title: "Invalid count",
        description: "Enter a whole number between 1 and 500.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await bulkCreateTables({ count: n });
      const createdCount = res?.created?.length ?? 0;
      const skippedCount = res?.skipped?.length ?? 0;
      toast({
        title: "Tables created",
        description:
          `${createdCount} table(s) created` +
          (skippedCount ? `, ${skippedCount} already existed.` : "."),
      });
      if (res?.mint_warning) {
        toast({ title: "QR not generated", description: res.mint_warning, variant: "destructive" });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create tables",
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
          <DialogTitle>Set Up Tables</DialogTitle>
          <DialogDescription>
            Create tables numbered 1 to N in one go. Existing numbers are skipped, so it's safe to
            re-run after adding capacity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="count">Number of tables*</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={500}
                placeholder="e.g. 20"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Creates tables 1–{count && Number(count) > 0 ? count : "N"}. QR codes are generated
                automatically when WhatsApp QR is enabled.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Tables"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCreateTablesDialog;
