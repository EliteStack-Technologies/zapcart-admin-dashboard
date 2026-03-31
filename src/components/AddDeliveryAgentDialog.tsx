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
import { createDeliveryAgent, updateDeliveryAgent, DeliveryAgent } from "@/services/deliveryAgents";
import { Eye, EyeOff } from "lucide-react";

interface AddDeliveryAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingAgent?: DeliveryAgent;
}

const AddDeliveryAgentDialog = ({ open, onOpenChange, onSuccess, editingAgent }: AddDeliveryAgentDialogProps) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      phone_number: "",
      email: "",
      password: "",
      vehicle_type: "",
      vehicle_number: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (editingAgent) {
        reset({
          name: editingAgent.name,
          phone_number: editingAgent.phone_number,
          email: editingAgent.email,
          password: "",
          vehicle_type: editingAgent.vehicle_type || "",
          vehicle_number: editingAgent.vehicle_number || "",
        });
      } else {
        reset({
          name: "",
          phone_number: "",
          email: "",
          password: "",
          vehicle_type: "",
          vehicle_number: "",
        });
      }
      setShowPassword(false);
    }
  }, [open, editingAgent, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const payload: any = {
      name: data.name,
      phone_number: data.phone_number,
      email: data.email,
      vehicle_type: data.vehicle_type || undefined,
      vehicle_number: data.vehicle_number || undefined,
    };

    if (data.password) {
      payload.password = data.password;
    }

    try {
      if (editingAgent) {
        await updateDeliveryAgent(editingAgent._id, payload);
        toast({
          title: "Agent Updated",
          description: "Delivery agent details have been updated successfully.",
        });
      } else {
        await createDeliveryAgent(payload);
        toast({
          title: "Agent Created",
          description: "New delivery agent has been added successfully.",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving delivery agent:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save delivery agent",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingAgent ? "Edit Delivery Agent" : "Add Delivery Agent"}</DialogTitle>
          <DialogDescription>
            {editingAgent
              ? "Update the details of the delivery agent."
              : "Register a new delivery agent to your fleet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name*</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number*</Label>
                <Input
                  id="phone_number"
                  placeholder="+1234567890"
                  {...register("phone_number", { required: "Phone number is required" })}
                />
                {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address*</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{editingAgent ? "New Password (Optional)" : "Password*"}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={editingAgent ? "Leave blank to keep unchanged" : "••••••••"}
                  {...register("password", {
                    required: !editingAgent ? "Password is required" : false
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Vehicle Type</Label>
                <Input
                  id="vehicle_type"
                  placeholder="Bike, Van, etc."
                  {...register("vehicle_type")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_number">Vehicle Number</Label>
                <Input
                  id="vehicle_number"
                  placeholder="AB-12-CD-3456"
                  {...register("vehicle_number")}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (editingAgent ? "Update Agent" : "Add Agent")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeliveryAgentDialog;
