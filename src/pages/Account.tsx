import {
  Save,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { getAccountDetails, updateAccountDetails } from "@/services/accountDetails";

// Validation schema
const accountSchema = z.object({
  phone_number: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
          val
        ),
      "Please enter a valid phone number"
    ),
  email: z.string().email("Please enter a valid email address"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  facebook_url: z.string().url().optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const Account = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState<any>(null);

  const { toast } = useToast();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      phone_number: "",
      email: "",
      location: "",
      facebook_url: "",
      instagram_url: "",
    },
    mode: "onChange", // Real-time validation
  });

  useEffect(() => {    
    const fetchData = async () => {
      try {
        setIsFetching(true);
        setError(null);
        const data = await getAccountDetails();
        setAccountDetails(data);
        
        // Reset form with fetched data
        form.reset({
          phone_number: data?.phone_number || "",
          email: data?.email || "",
          location: data?.location || "",
          facebook_url: data?.facebook_url || "",
          instagram_url: data?.instagram_url || "",
        });
      } catch (error) {
        console.error("Error fetching account details:", error);
        setError("Failed to load account details");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, []);

 const onSubmit = async (data: AccountFormValues) => {
  try {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    console.log("Submitting account details:", data);

    // Call actual API
    const response = await updateAccountDetails(data);

    setAccountDetails(response)

    setSuccess("Account details saved successfully!");
    toast({
      title: "Success",
      description: "Your account details have been updated.",
    });

    // Optional: Refetch after update
    // await fetchData();

  } catch (err: any) {
    const errorMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to save account details";

    setError(errorMessage);
    console.error("Error saving account details:", err);

    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};



  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Account Details
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your business contact information and social media presence
            </p>
          </div>
        </div>

        <Separator />

        {/* Loading State */}
        {isFetching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isFetching && (
          <>
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Email Field */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-primary" />
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your@email.com"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Phone Field */}
                      <FormField
                        control={form.control}
                        name="phone_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-primary" />
                              Phone Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Location Field */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            Business Location
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="City, State, Country"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Social Media Links */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Social Media</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Facebook Field */}
                    <FormField
                      control={form.control}
                      name="facebook_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Facebook className="w-4 h-4 text-primary" />
                            Facebook Page URL
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://facebook.com/yourpage"
                              {...field}
                              value={field.value || ""}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Instagram Field */}
                    <FormField
                      control={form.control}
                      name="instagram_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Instagram className="w-4 h-4 text-primary" />
                            Instagram Profile URL
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://instagram.com/yourprofile"
                              {...field}
                              value={field.value || ""}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save All Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Account;
