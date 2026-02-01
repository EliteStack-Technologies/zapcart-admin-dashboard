import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ExternalLink, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { generateAuthUrl } from "@/services/zoho";

const oauthFormSchema = z.object({
  client_id: z
    .string()
    .min(1, "Client ID is required")
    .startsWith("1000.", "Client ID must start with '1000.'"),
  client_secret: z.string().min(1, "Client Secret is required"),
  redirect_uri: z
    .string()
    .min(1, "Redirect URI is required")
    .url("Must be a valid URL"),
});

type OAuthFormValues = z.infer<typeof oauthFormSchema>;

interface OAuthConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OAuthConnectionDialog = ({ open, onOpenChange }: OAuthConnectionDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);

  // Auto-fill redirect URI based on current domain
  const defaultRedirectUri = `${window.location.origin}/zoho/callback`;

  const form = useForm<OAuthFormValues>({
    resolver: zodResolver(oauthFormSchema),
    defaultValues: {
      client_id: "",
      client_secret: "",
      redirect_uri: defaultRedirectUri,
    },
  });

  const onSubmit = async (data: OAuthFormValues) => {
    try {
      setIsLoading(true);

      // Generate OAuth authorization URL
      const response = await generateAuthUrl({
        client_id: data.client_id,
        redirect_uri: data.redirect_uri,
      });

      // Save credentials to sessionStorage (temporary storage during OAuth flow)
      sessionStorage.setItem("zoho_client_id", data.client_id);
      sessionStorage.setItem("zoho_client_secret", data.client_secret);
      sessionStorage.setItem("zoho_redirect_uri", data.redirect_uri);

      // Redirect to Zoho authorization page
      window.location.href = response.auth_url;
    } catch (error: any) {
      console.error("Error generating auth URL:", error);
      toast({
        title: "Connection Failed",
        description: error?.response?.data?.message || "Failed to initiate OAuth flow",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Connect Zoho Books</DialogTitle>
          <DialogDescription>
            Enter your Zoho API credentials to connect your Zoho Books account.{" "}
            <a
              href="https://api-console.zoho.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Get credentials
              <ExternalLink className="w-3 h-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client ID */}
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1000.XXXXX.XXXXX"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    From Zoho API Console → Server-based Applications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Secret */}
            <FormField
              control={form.control}
              name="client_secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Secret</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showClientSecret ? "text" : "password"}
                        placeholder="••••••••••••••••"
                        {...field}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowClientSecret(!showClientSecret)}
                        disabled={isLoading}
                      >
                        {showClientSecret ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Redirect URI */}
            <FormField
              control={form.control}
              name="redirect_uri"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redirect URI</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    Add this URL to your Zoho API Console redirect URIs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect with Zoho"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OAuthConnectionDialog;
