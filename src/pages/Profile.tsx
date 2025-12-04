import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, DollarSign, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { format, isValid, parseISO } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  getClientProfile,
  clearProfileCache,
  updateCurrency,
  changePassword,
  getCurrencies,
  ClientProfile,
  Currency,
} from "@/services/profile";

export default function Profile() {
  const { toast } = useToast();
  const { refreshCurrency } = useCurrency();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCurrency, setUpdatingCurrency] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fetchingRef = useRef(false); // Prevent duplicate API calls

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Prevent duplicate calls
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    fetchProfileData();
  }, []);

  const fetchProfileData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const [profileData, currenciesData] = await Promise.all([
        getClientProfile(forceRefresh), // Use cache by default, force refresh only when needed
        getCurrencies().catch(() => []), // If currencies API fails, continue with empty array
      ]);
      
      setProfile(profileData);
      setCurrencies(currenciesData);
      
      // Set selected currency if profile has one
      if (profileData.currency_id) {
        const currencyId = typeof profileData.currency_id === 'object' 
          ? profileData.currency_id._id 
          : profileData.currency_id;
        setSelectedCurrencyId(currencyId);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyUpdate = async () => {
    if (!selectedCurrencyId) {
      toast({
        title: "Validation Error",
        description: "Please select a currency",
        variant: "destructive",
      });
      return;
    }

    setUpdatingCurrency(true);
    try {
      await updateCurrency(selectedCurrencyId);
      toast({
        title: "Success",
        description: "Currency updated successfully",
      });
      clearProfileCache(); // Clear cache to fetch fresh data
      await refreshCurrency(); // Update global currency context
      fetchProfileData(true); // Force refresh profile data
    } catch (error: any) {
      console.error("Error updating currency:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update currency",
        variant: "destructive",
      });
    } finally {
      setUpdatingCurrency(false);
    }
  };

  const onPasswordSubmit = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (data.newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(data.oldPassword, data.newPassword);
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      resetPassword();
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "MMM dd, yyyy") : "N/A";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account Details
            </TabsTrigger>
            <TabsTrigger value="currency">
              <DollarSign className="h-4 w-4 mr-2" />
              Currency
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </TabsTrigger>
          </TabsList>

          {/* Account Details Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input value={profile?.customer_name || "N/A"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile?.email || "N/A"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={profile?.phone_number || "N/A"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input value={profile?.business_name || "N/A"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Type</Label>
                    <Input value={profile?.business_type || "N/A"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Sub Domain</Label>
                    <Input value={profile?.sub_domain_name || "N/A"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input value={formatDate(profile?.start_date)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input 
                      value={formatDate(profile?.end_date)} 
                      disabled 
                      className={
                        profile?.end_date && new Date(profile.end_date) < new Date() 
                          ? 'text-red-600 font-medium' 
                          : 'text-green-600 font-medium'
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Input 
                      value={profile?.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : "N/A"} 
                      disabled 
                      className={profile?.status === 'active' ? 'text-green-600 font-medium' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Currency</Label>
                    <Input
                      value={
                        profile?.currency_id && typeof profile.currency_id === 'object'
                          ? `${profile.currency_id.name} (${profile.currency_id.symbol})`
                          : "Not set"
                      }
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currency Management Tab */}
          <TabsContent value="currency">
            <Card>
              <CardHeader>
                <CardTitle>Currency Settings</CardTitle>
                <CardDescription>
                  Select your preferred currency for transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Select Currency</Label>
                  <Select
                    value={selectedCurrencyId}
                    onValueChange={setSelectedCurrencyId}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.length > 0 ? (
                        currencies.map((currency) => (
                          <SelectItem key={currency._id} value={currency._id}>
                            {currency.name} ({currency.symbol}) - {currency.code}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          No currencies available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {profile?.currency_id && typeof profile.currency_id === 'object' && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Current Currency</p>
                    <p className="text-lg font-bold mt-1">
                      {profile.currency_id.name} ({profile.currency_id.symbol})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Code: {profile.currency_id.code}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleCurrencyUpdate}
                  disabled={updatingCurrency || !selectedCurrencyId}
                  className="w-full"
                >
                  {updatingCurrency ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Currency"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Change Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Current Password*</Label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        {...registerPassword("oldPassword", {
                          required: "Current password is required",
                        })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showOldPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.oldPassword && (
                      <p className="text-xs text-destructive">
                        {passwordErrors.oldPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password*</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password (min 6 characters)"
                        {...registerPassword("newPassword", {
                          required: "New password is required",
                          minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters",
                          },
                        })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-destructive">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password*</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        {...registerPassword("confirmPassword", {
                          required: "Please confirm your password",
                        })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={changingPassword} className="w-full">
                    {changingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
