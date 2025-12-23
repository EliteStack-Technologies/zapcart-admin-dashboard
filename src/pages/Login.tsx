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
import { AlertCircle, Loader2 } from "lucide-react";
import axiosInstance from "@/services/axiosInstance";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // const onSubmit = async (data: LoginFormValues) => {
  //   try {
  //     setIsSubmitting(true);
  //     setError(null);

  //     const success = await login(data.email, data.password);

  //     if (success) {
  //       navigate("/");
  //     } else {
  //       setError("Invalid email or password. Please try again.");
  //     }
  //   } catch (err) {
  //     setError(
  //       err instanceof Error ? err.message : "An error occurred during login"
  //     );
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const onSubmit = async (data: LoginFormValues) => {
    setError("");
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!data.email || !data.password) {
        throw new Error("Email and password are required");
      }

      // Make login request
      const response = await axiosInstance.post("/api/v1/clients/login", {
        email: data.email,
        password: data.password,
      });

      // Check if response has token
      if (!response?.data?.accessToken) {
        throw new Error("No authentication token received from server");
      }

      // Store token in localStorage
      localStorage.setItem("accessToken", response.data.accessToken);

      // Store user data if available
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      // Call login function to update AuthContext state
      const isLoginSuccessful = await login(data.email, data.password);

      if (isLoginSuccessful) {
        // Navigation happens after AuthContext is updated
        navigate("/");
      } else {
        throw new Error("Failed to authenticate. Please try again.");
      }
      
    } catch (err: any) {
      // Handle different error types
      if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else if (err.response?.status === 404) {
        setError("User not found");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later");
      } else if (err.message) {
        
        setError(err.response?.data?.message);
      } else {
        setError(
          err.response?.data?.message || "Login failed. Please try again"
        );
      }
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ZapCart</h1>
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

          {/* Demo Credentials */}
          {/* <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Demo Credentials:</strong>
            </p>
            <p className="text-sm text-gray-600">
              Email: <code className="bg-gray-100 px-2 py-1 rounded">demo@example.com</code>
            </p>
            <p className="text-sm text-gray-600">
              Password: <code className="bg-gray-100 px-2 py-1 rounded">password</code>
            </p>
          </div> */}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2024 ZapCart Admin Dashboard. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
