import { useState } from "react";
import { Building2, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updateZohoConfig } from "@/services/zoho";
import type { ZohoOrganization } from "@/services/zoho";
import { useAuth } from "@/contexts/AuthContext";

interface OrganizationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: ZohoOrganization[];
  onSuccess: () => void;
}

const OrganizationSelector = ({
  open,
  onOpenChange,
  organizations,
  onSuccess,
}: OrganizationSelectorProps) => {
  const { toast } = useToast();
  const { setZohoEnabled } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    organizations[0]?.organization_id || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedOrgId) {
      toast({
        title: "Selection Required",
        description: "Please select an organization to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Save selected organization and enable sync
      await updateZohoConfig({
        zoho_organization_id: selectedOrgId,
        zoho_enabled: true,
      });

      // Update AuthContext
      setZohoEnabled(true);

      toast({
        title: "Success",
        description: "Zoho Books integration activated successfully!",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error saving organization:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save organization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Your Zoho Books Organization</DialogTitle>
          <DialogDescription>
            Choose the organization you want to sync with this account
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {organizations.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                No organizations found in your Zoho Books account
              </p>
            </Card>
          ) : (
            <RadioGroup value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <div className="space-y-3">
                {organizations.map((org) => (
                  <Card
                    key={org.organization_id}
                    className={`p-4 cursor-pointer transition-all hover:border-primary ${
                      selectedOrgId === org.organization_id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => setSelectedOrgId(org.organization_id)}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={org.organization_id}
                        id={org.organization_id}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={org.organization_id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{org.name}</span>
                          {selectedOrgId === org.organization_id && (
                            <Check className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </Label>
                        <div className="mt-1 text-sm text-muted-foreground">
                          <div>Organization ID: {org.organization_id}</div>
                          <div>
                            Currency: {org.currency_code}
                            {org.currency_symbol && ` (${org.currency_symbol})`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={isLoading || organizations.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationSelector;
