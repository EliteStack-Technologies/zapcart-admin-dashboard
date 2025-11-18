import { Save, Phone, Mail, MapPin, Facebook, Instagram, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Account = () => {
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Account Details</h1>
            <p className="text-muted-foreground mt-2">
              Manage your business contact information and social media presence
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-email">Account Email</Label>
              <Input 
                id="account-email"
                type="email"
                value={userEmail}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                This is your login email address
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Phone Number
                </Label>
                <Input 
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  defaultValue="+1 (555) 987-6543"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="contact@business.com"
                  defaultValue="contact@businesshub.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Business Location
              </Label>
              <Input 
                id="location"
                type="text"
                placeholder="123 Main Street, City, State 12345"
                defaultValue="456 Commerce Ave, Business District, CA 94102"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Social Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="w-4 h-4 text-primary" />
                Facebook Page URL
              </Label>
              <Input 
                id="facebook"
                type="url"
                placeholder="https://facebook.com/yourbusiness"
                defaultValue="https://facebook.com/businesshub"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-primary" />
                Instagram Profile URL
              </Label>
              <Input 
                id="instagram"
                type="url"
                placeholder="https://instagram.com/yourbusiness"
                defaultValue="https://instagram.com/businesshub"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Business Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" },
              { day: "Saturday", hours: "10:00 AM - 4:00 PM" },
              { day: "Sunday", hours: "Closed" },
            ].map((schedule, i) => (
              <div key={i}>
                <div className="flex items-center justify-between py-3">
                  <span className="font-medium text-foreground">{schedule.day}</span>
                  <span className="text-muted-foreground">{schedule.hours}</span>
                </div>
                {i < 2 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button className="flex-1 gap-2">
            <Save className="w-4 h-4" />
            Save All Changes
          </Button>
          <Button variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Account;
