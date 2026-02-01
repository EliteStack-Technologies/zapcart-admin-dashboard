import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { exchangeCode } from "@/services/zoho";
import DashboardLayout from "@/components/DashboardLayout";

const ZohoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing authorization...");
  const [showRevokeInstructions, setShowRevokeInstructions] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Extract code and error from URL
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Check for errors
      if (error) {
        setStatus("error");
        setMessage(errorDescription || "Authorization failed. Please try again.");
        setTimeout(() => navigate("/settings/zoho-books"), 3000);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("No authorization code received. Please try again.");
        setTimeout(() => navigate("/settings/zoho-books"), 3000);
        return;
      }

      // Retrieve saved credentials from sessionStorage
      const client_id = sessionStorage.getItem("zoho_client_id");
      const client_secret = sessionStorage.getItem("zoho_client_secret");
      const redirect_uri = sessionStorage.getItem("zoho_redirect_uri");

      if (!client_id || !client_secret || !redirect_uri) {
        setStatus("error");
        setMessage("Session expired. Please start the connection process again.");
        setTimeout(() => navigate("/settings/zoho-books"), 3000);
        return;
      }

      try {
        // Exchange code for tokens
        await exchangeCode({
          code,
          client_id,
          client_secret,
          redirect_uri,
        });

        // Clear sessionStorage
        sessionStorage.removeItem("zoho_client_id");
        sessionStorage.removeItem("zoho_client_secret");
        sessionStorage.removeItem("zoho_redirect_uri");

        setStatus("success");
        setMessage("Zoho Books connected successfully!");

        // Redirect to organization selection
        setTimeout(() => navigate("/settings/zoho-books?step=select-org"), 1500);
      } catch (error: any) {
        console.error("Error exchanging code:", error);
        setStatus("error");
        
        const errorMessage = error?.response?.data?.message || error?.message || "";
        
        // Check for "No refresh token available" error
        if (errorMessage.includes("No refresh token available") || 
            errorMessage.includes("refresh token")) {
          setMessage("Authorization Issue");
          setShowRevokeInstructions(true);
        } else {
          setMessage(errorMessage || "Failed to complete authorization. Please try again.");
          setTimeout(() => navigate("/settings/zoho-books"), 5000);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === "loading" && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Connecting to Zoho Books
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Connection Successful
                </>
              )}
              {status === "error" && (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  {showRevokeInstructions ? "Authorization Issue" : "Connection Failed"}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showRevokeInstructions ? (
              <>
                <Alert variant="destructive">
                  <AlertTitle>Please revoke the app access in Zoho and try again</AlertTitle>
                  <AlertDescription>
                    The authorization didn't include the required refresh token. 
                    This usually happens when the app was previously authorized without the correct permissions.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p className="font-semibold text-sm">Follow these steps:</p>
                  <ol className="text-sm space-y-2 list-decimal list-inside">
                    <li>Go to Zoho Accounts Security page</li>
                    <li>Click on "Connected Apps" tab</li>
                    <li>Find "ZapCart" in the list</li>
                    <li>Click "Revoke" to remove the app</li>
                    <li>Return here and click "Connect" again</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate("/settings/zoho-books")}
                  >
                    Back to Settings
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => window.open("https://accounts.zoho.com/home#security/connectedapps", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Zoho Security
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert variant={status === "error" ? "destructive" : "default"}>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                {status === "loading" && (
                  <p className="text-sm text-muted-foreground">
                    Please wait while we complete the authorization...
                  </p>
                )}
                {status === "success" && (
                  <p className="text-sm text-muted-foreground">
                    Redirecting to organization selection...
                  </p>
                )}
                {status === "error" && (
                  <p className="text-sm text-muted-foreground">
                    Redirecting back to settings...
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ZohoCallback;
