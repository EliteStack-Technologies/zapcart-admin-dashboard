import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if this is a customer portal request (not admin managing customers)
    // Admin endpoints for customer management: /customer-auth/set-password, /customer-auth/toggle-login
    const isAdminCustomerManagement = config.url?.includes('/customer-auth/set-password') || 
                                       config.url?.includes('/customer-auth/toggle-login') ||
                                       config.url?.includes('/customer-auth/login-status');
    
    // Check if this is a customer auth endpoint (customer portal side)
    if (config.url?.includes('/customer-auth/') && !isAdminCustomerManagement) {
      const customerToken = localStorage.getItem("customer_token");
      if (customerToken) {
        config.headers.Authorization = `Bearer ${customerToken}`;
      }
    } else {
      // Use admin token for other requests (including admin customer management)
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Check if this is an admin request for customer management
      const isAdminCustomerManagement = error.config?.url?.includes('/customer-auth/set-password') || 
                                         error.config?.url?.includes('/customer-auth/toggle-login') ||
                                         error.config?.url?.includes('/customer-auth/login-status');
      
      // Check if it's a customer auth request (from customer portal)
      if (error.config?.url?.includes('/customer-auth/') && !isAdminCustomerManagement) {
        // Unauthorized customer - clear customer auth and redirect to customer login
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_info");
        window.location.href = "/customer/login";
      } else {
        // Unauthorized admin - clear auth and redirect to admin login
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    if (error.response?.status === 403) {
      console.error("Forbidden - insufficient permissions");
    }

    if (error.response?.status === 500) {
      console.error("Server error");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
