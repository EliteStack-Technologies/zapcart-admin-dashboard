import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";

// This function allows the app to switch between different client APIs (Multi-tenancy)
const getBaseURL = () => {
  const customUrl = localStorage.getItem("custom_api_url");
  if (customUrl) return customUrl;
  return import.meta.env.VITE_API_BASE_URL || "https://api.zapcart.zapelite.com";
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Use this function to switch the API server at runtime
export const updateBaseURL = (newUrl: string) => {
  localStorage.setItem("custom_api_url", newUrl);
  axiosInstance.defaults.baseURL = newUrl;
};

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
      if (!config.headers.Authorization) {
        const token = localStorage.getItem("accessToken");
        const deliveryToken = localStorage.getItem("delivery_agent_token");
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (deliveryToken) {
          config.headers.Authorization = `Bearer ${deliveryToken}`;
        }
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
      } else if (error.config?.url?.includes('/delivery-app/')) {
        // Unauthorized delivery agent - redirect to delivery login
        localStorage.removeItem("delivery_agent_token");
        localStorage.removeItem("delivery_agent_info");
        const isDeliveryLogin = window.location.pathname === "/delivery-agent-login";
        if (!isDeliveryLogin) {
          window.location.href = "/delivery-agent-login";
        }
      } else {
        // Unauthorized admin or other - check if we are in the delivery portal
        const isDeliveryPortal = window.location.pathname.startsWith("/delivery-portal") || 
                               window.location.pathname.startsWith("/delivery-agent-login");
        
        if (isDeliveryPortal) {
          // If 401 happens while on delivery portal, it might be the refreshCurrency call failing
          // Don't redirect to admin login. If the agent token itself is invalid, another interceptor (above) handles it.
          console.warn("401 Unauthorized encountered on delivery portal. Skipping admin redirect.");
          return Promise.reject(error);
        }

        // Unauthorized admin - clear auth but don't loop if already on login page
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        
        const isLoginPage = window.location.pathname === "/login";
        const isLoginRequest = error.config?.url?.includes("/clients/login");

        if (!isLoginPage && !isLoginRequest) {
          window.location.href = "/login";
        }
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
