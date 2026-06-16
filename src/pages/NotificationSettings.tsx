import { useEffect, useState } from "react";
import {
  Loader2,
  Bell,
  CheckCircle2,
  PackageCheck,
  Truck,
  PackageOpen,
  XCircle,
  MessageCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotifiableStatus,
  type OrderStatusNotifications,
} from "@/services/orders";

// Display copy + icon for each toggleable status.
const STATUS_META: {
  key: NotifiableStatus;
  label: string;
  description: string;
  icon: typeof Bell;
}[] = [
  {
    key: "confirmed",
    label: "Order Confirmed",
    description: "Sent when an order is confirmed.",
    icon: CheckCircle2,
  },
  {
    key: "processing",
    label: "Processing",
    description: "Sent when an order moves to processing / being prepared.",
    icon: PackageOpen,
  },
  {
    key: "shipped",
    label: "Shipped / Out for Delivery",
    description: "Sent when an order is shipped or out for delivery.",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Sent when an order is marked as delivered.",
    icon: PackageCheck,
  },
  {
    key: "cancelled",
    label: "Cancelled",
    description: "Sent when an order is cancelled.",
    icon: XCircle,
  },
];

const NotificationSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [settings, setSettings] = useState<OrderStatusNotifications | null>(null);
  // Track which status row is currently saving so we can disable just that switch.
  const [savingKey, setSavingKey] = useState<NotifiableStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getNotificationSettings();
        if (!mounted) return;
        setMasterEnabled(data.customer_whatsapp_notifications !== false);
        setSettings(data.order_status_whatsapp_notifications);
      } catch (error) {
        toast({
          title: "Failed to load notification settings",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleToggle = async (key: NotifiableStatus, value: boolean) => {
    if (!settings) return;
    const previous = settings[key];
    // Optimistic update.
    setSettings({ ...settings, [key]: value });
    setSavingKey(key);
    try {
      const res = await updateNotificationSettings({ [key]: value });
      setSettings(res.order_status_whatsapp_notifications);
      toast({
        title: `${value ? "Enabled" : "Disabled"} ${STATUS_META.find((s) => s.key === key)?.label}`,
        description: value
          ? "Customers will get a WhatsApp message for this status."
          : "No WhatsApp message will be sent for this status.",
      });
    } catch (error) {
      // Roll back on failure.
      setSettings((prev) => (prev ? { ...prev, [key]: previous } : prev));
      toast({
        title: "Could not update setting",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Choose which order status updates are sent to customers on WhatsApp.
            </p>
          </div>
        </div>

        {!loading && !masterEnabled && (
          <Alert variant="destructive">
            <AlertDescription>
              WhatsApp notifications are currently disabled for your account at the platform
              level. These per-status settings are saved, but no messages will be sent until the
              master switch is enabled. Please contact support to enable it.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Order Status Updates
            </CardTitle>
            <CardDescription>
              When a status is turned on, the customer automatically receives a WhatsApp message
              the moment an order reaches that status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="divide-y">
                {STATUS_META.map(({ key, label, description, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <Label
                          htmlFor={`notify-${key}`}
                          className="text-base font-medium cursor-pointer"
                        >
                          {label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <Switch
                      id={`notify-${key}`}
                      checked={settings ? settings[key] !== false : false}
                      onCheckedChange={(value) => handleToggle(key, value)}
                      disabled={savingKey === key}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettings;
