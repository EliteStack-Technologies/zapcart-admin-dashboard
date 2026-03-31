import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2, Building2 } from "lucide-react";
import axiosInstance, { updateBaseURL } from "@/services/axiosInstance";
import { registerFCMOnLogin } from "@/hooks/useFCM";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface AssignedClient {
  _id: string;
  client_name: string;
  business_name: string;
  email: string;
  sub_domain_name: string;
  status: string;
  business_type?: string[];
  currency_id?: any;
  enquiry_mode?: boolean;
  inventory_enabled?: boolean;
}

const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Branch admin state
  const [isBranchAdmin, setIsBranchAdmin] = useState(false);
  const [branchAdminToken, setBranchAdminToken] = useState<string | null>(null);
  const [assignedClients, setAssignedClients] = useState<AssignedClient[]>([]);
  const [branchAdminInfo, setBranchAdminInfo] = useState<any>(null);
  const [selectingClient, setSelectingClient] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleClientSelect = async (client: AssignedClient) => {
    if (selectingClient) return;
    setSelectingClient(true);
    setError(null);

    try {
      // Call switch-client endpoint to get a client-scoped JWT
      const response = await axiosInstance.post(
        `/api/v1/branch-admins/switch-client/${client._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${branchAdminToken}`,
          },
        }
      );

      if (!response?.data?.accessToken) {
        throw new Error("Failed to switch to client");
      }

      // Store token
      localStorage.setItem("accessToken", response.data.accessToken);

      // Store branch admin info for the client switcher
      localStorage.setItem("branch_admin_token", branchAdminToken!);
      localStorage.setItem("branch_admin_info", JSON.stringify(branchAdminInfo));
      localStorage.setItem("assigned_clients", JSON.stringify(assignedClients));
      localStorage.setItem("is_branch_admin", "true");

      // Store user/client data
      if (response.data.client) {
        const userData = {
          id: response.data.client.id,
          email: response.data.client.email,
          name: response.data.client.client_name || response.data.client.business_name,
          business_name: response.data.client.business_name,
          business_type: response.data.client.business_type,
          enquiry_mode: response.data.client.enquiry_mode || false,
          inventory_enabled: response.data.client.inventory_enabled || false,
          zoho_enabled: response.data.client.zoho_enabled || false,
          delivery_management_enabled: response.data.client.delivery_management_enabled || false,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("enquiry_mode", String(response.data.client.enquiry_mode || false));
        localStorage.setItem("inventory_enabled", String(response.data.client.inventory_enabled || false));
        localStorage.setItem("zoho_enabled", String(response.data.client.zoho_enabled || false));
        localStorage.setItem("delivery_management_enabled", String(response.data.client.delivery_management_enabled || false));
        if (response.data.client.sub_domain_name) {
          localStorage.setItem("sub_domain_name", response.data.client.sub_domain_name);
        }
      }

      // Store currency
      if (response.data.client?.currency_id) {
        const currencyData = {
          _id: response.data.client.currency_id._id,
          name: response.data.client.currency_id.name,
          symbol: response.data.client.currency_id.symbol,
          code: response.data.client.currency_id.code,
        };
        localStorage.setItem("currency", JSON.stringify(currencyData));
        window.dispatchEvent(new Event("currencyUpdated"));
      }

      // Update AuthContext
      await login(response.data.client?.email || "", "");

      // Register FCM
      const clientId = response.data.client?.id || null;
      if (clientId) {
        registerFCMOnLogin(clientId);
      }

      // Navigate
      const isMobile = window.innerWidth < 764;
      navigate(isMobile ? "/orders" : "/");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to switch to client");
    } finally {
      setSelectingClient(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      if (!data.email || !data.password) {
        throw new Error("Email and password are required");
      }

      // Try client login first
      try {
        const response = await axiosInstance.post("/api/v1/clients/login", {
          email: data.email.trim(),
          password: data.password,
        });

        if (response?.data?.accessToken) {
          // Regular client login success
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.removeItem("is_branch_admin");
          localStorage.removeItem("branch_admin_token");
          localStorage.removeItem("branch_admin_info");
          localStorage.removeItem("assigned_clients");

          if (response.data.client) {
            const userData = {
              id: response.data.client.id,
              email: response.data.client.email,
              name: response.data.client.client_name || response.data.client.business_name,
              business_name: response.data.client.business_name,
              business_type: response.data.client.business_type,
              enquiry_mode: response.data.client.enquiry_mode || false,
              inventory_enabled: response.data.client.inventory_enabled || false,
              zoho_enabled: response.data.client.zoho_enabled || false,
              delivery_management_enabled: response.data.client.delivery_management_enabled || false,
            };
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("enquiry_mode", String(response.data.client.enquiry_mode || false));
            localStorage.setItem("inventory_enabled", String(response.data.client.inventory_enabled || false));
            localStorage.setItem("zoho_enabled", String(response.data.client.zoho_enabled || false));
            localStorage.setItem("delivery_management_enabled", String(response.data.client.delivery_management_enabled || false));
            if (response.data.client.sub_domain_name) {
              localStorage.setItem("sub_domain_name", response.data.client.sub_domain_name);
            }
          } else if (response.data.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }

          if (response.data.client?.currency_id) {
            const currencyData = {
              _id: response.data.client.currency_id._id,
              name: response.data.client.currency_id.name,
              symbol: response.data.client.currency_id.symbol,
              code: response.data.client.currency_id.code,
            };
            localStorage.setItem("currency", JSON.stringify(currencyData));
            window.dispatchEvent(new Event("currencyUpdated"));
          }

          await login(data.email, data.password);

          const clientId =
            response.data.client?._id ||
            response.data.client?.id ||
            response.data.client?.client_id ||
            null;

          if (clientId) {
            registerFCMOnLogin(clientId);
          }

          const isMobile = window.innerWidth < 764;
          navigate(isMobile ? "/orders" : "/");
          return;
        }
      } catch (clientErr: any) {
        // Client login failed, try branch admin login
        if (clientErr.response?.status === 400 || clientErr.response?.status === 404) {
          // Try branch admin login
          try {
            const branchResponse = await axiosInstance.post("/api/v1/branch-admins/login", {
              email: data.email.trim(),
              password: data.password,
            });

            if (branchResponse?.data?.accessToken && branchResponse?.data?.role === "branch_admin") {
              // Branch admin login success - show client selector
              setBranchAdminToken(branchResponse.data.accessToken);
              setBranchAdminInfo(branchResponse.data.branchAdmin);
              setAssignedClients(branchResponse.data.branchAdmin.assigned_clients || []);
              setIsBranchAdmin(true);
              setIsSubmitting(false);
              return;
            }
          } catch (branchErr: any) {
            // Both login attempts failed
            if (branchErr.response?.status === 403) {
              throw new Error(branchErr.response?.data?.message || "Account is inactive");
            }
            throw new Error("Invalid email or password");
          }
        } else if (clientErr.response?.status === 403) {
          throw new Error(clientErr.response?.data?.message || "Account is inactive");
        } else {
          throw clientErr;
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else if (err.response?.status === 404) {
        setError("User not found");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later");
      } else {
        setError(err.response?.data?.message || err.message || "Login failed. Please try again");
      }
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Branch Admin: Client Selection Screen
  if (isBranchAdmin && assignedClients.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ZapGoCart</h1>
              <p className="text-gray-600">Welcome, {branchAdminInfo?.name}</p>
              <p className="text-sm text-gray-500 mt-1">Select a client to manage</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {assignedClients.map((client) => (
                <button
                  key={client._id}
                  onClick={() => handleClientSelect(client)}
                  disabled={selectingClient || client.status === "inactive"}
                  className={`w-full flex items-center gap-4 p-4 border rounded-lg text-left transition-all duration-200 ${client.status === "inactive"
                      ? "opacity-50 cursor-not-allowed bg-gray-50"
                      : "hover:border-blue-400 hover:bg-blue-50 hover:shadow-md cursor-pointer"
                    }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {client.business_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {client.client_name} • {client.email}
                    </p>
                  </div>
                  {client.status === "inactive" && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setIsBranchAdmin(false);
                setBranchAdminToken(null);
                setAssignedClients([]);
                setBranchAdminInfo(null);
                setError(null);
              }}
              className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              ← Back to login
            </button>
          </div>

          <div className="text-center mt-6 text-sm text-gray-600">
            <p>© 2026 ZapGoCart Admin Dashboard. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ZapGoCart</h1>
            <p className="text-gray-600">Admin Dashboard Login</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2026 ZapGoCart Admin Dashboard. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
