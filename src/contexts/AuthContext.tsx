import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  client_id?: string;
  enquiry_mode?: boolean;
  inventory_enabled?: boolean;
  zoho_enabled?: boolean;
  business_type?: string;
  business_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  token: string | null;
  enquiryMode: boolean;
  setEnquiryMode: (mode: boolean) => void;
  inventoryEnabled: boolean;
  zohoEnabled: boolean;
  setZohoEnabled: (enabled: boolean) => void;
  isRestaurant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enquiryMode, setEnquiryModeState] = useState<boolean>(() => {
    const stored = localStorage.getItem("enquiry_mode");
    return stored === "true";
  });
  const [inventoryEnabled, setInventoryEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem("inventory_enabled");
    return stored === "true";
  });
  const [zohoEnabled, setZohoEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem("zoho_enabled");
    return stored === "true";
  });

  // Initialize from localStorage on mount
  useEffect(() => {
    // Check both old and new token keys for backwards compatibility
    const storedToken = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    const storedEnquiryMode = localStorage.getItem("enquiry_mode");
    const storedInventoryEnabled = localStorage.getItem("inventory_enabled");
    const storedZohoEnabled = localStorage.getItem("zoho_enabled");   

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Sync enquiry_mode from localStorage or user object
        if (storedEnquiryMode !== null) {
          setEnquiryModeState(storedEnquiryMode === "true");
        } else if (parsedUser.enquiry_mode !== undefined) {
          setEnquiryModeState(parsedUser.enquiry_mode);
          localStorage.setItem("enquiry_mode", String(parsedUser.enquiry_mode));
        }
        
        // Sync inventory_enabled from localStorage or user object
        if (storedInventoryEnabled !== null) {
          setInventoryEnabledState(storedInventoryEnabled === "true");
        } else if (parsedUser.inventory_enabled !== undefined) {
          setInventoryEnabledState(parsedUser.inventory_enabled);
          localStorage.setItem("inventory_enabled", String(parsedUser.inventory_enabled));
        }
        
        // Sync zoho_enabled from localStorage or user object
        if (storedZohoEnabled !== null) {
          setZohoEnabledState(storedZohoEnabled === "true");
        } else if (parsedUser.zoho_enabled !== undefined) {
          setZohoEnabledState(parsedUser.zoho_enabled);
          localStorage.setItem("zoho_enabled", String(parsedUser.zoho_enabled));
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("enquiry_mode");
        localStorage.removeItem("inventory_enabled");
        localStorage.removeItem("zoho_enabled");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Check for token in localStorage (set by Login.tsx)
      const storedAccessToken = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (!storedAccessToken) {
        throw new Error("No authentication token found");
      }

      // Update state with stored values
      setToken(storedAccessToken);

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Sync enquiry_mode from user object if available
        if (parsedUser.enquiry_mode !== undefined) {
          setEnquiryModeState(parsedUser.enquiry_mode);
        }
        // Sync inventory_enabled from user object if available
        if (parsedUser.inventory_enabled !== undefined) {
          setInventoryEnabledState(parsedUser.inventory_enabled);
        }
        // Sync zoho_enabled from user object if available
        if (parsedUser.zoho_enabled !== undefined) {
          setZohoEnabledState(parsedUser.zoho_enabled);
        }
      }

      return true;
    } catch (error) {
      console.error("Login sync error:", error);
      return false;
    }
  };

  const setEnquiryMode = (mode: boolean) => {
    setEnquiryModeState(mode);
    localStorage.setItem("enquiry_mode", String(mode));
    
    // Update user object with enquiry_mode
    if (user) {
      const updatedUser = { ...user, enquiry_mode: mode };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const setZohoEnabled = (enabled: boolean) => {
    setZohoEnabledState(enabled);
    localStorage.setItem("zoho_enabled", String(enabled));
    
    // Update user object with zoho_enabled
    if (user) {
      const updatedUser = { ...user, zoho_enabled: enabled };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setEnquiryModeState(false);
    setInventoryEnabledState(false);
    setZohoEnabledState(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("currency");
    localStorage.removeItem("enquiry_mode");
    localStorage.removeItem("inventory_enabled");
    localStorage.removeItem("zoho_enabled");
  };

  const isRestaurant = user?.business_type?.toLowerCase() === "restaurant";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        token,
        enquiryMode,
        setEnquiryMode,
        inventoryEnabled,
        zohoEnabled,
        setZohoEnabled,
        isRestaurant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
