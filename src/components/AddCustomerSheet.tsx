import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { createCustomer, type Customer } from "@/services/customer";
import { useToast } from "@/hooks/use-toast";

interface AddCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: Customer) => void;
}

export default function AddCustomerSheet({
  open,
  onOpenChange,
  onCustomerCreated,
}: AddCustomerSheetProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name and phone are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const responseData: any = await createCustomer({
        name,
        phone,
        email: email || undefined,
      });

      // Handle both direct customer object and { customer: ... } wrapper
      const newCustomer = responseData?.customer || responseData;

      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      onCustomerCreated(newCustomer);

      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Customer</SheetTitle>
          <SheetDescription>
            Create a new customer to add to your order
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Customer Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Customer"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
