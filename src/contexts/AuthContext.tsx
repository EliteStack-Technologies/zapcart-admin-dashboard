import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  enquiry_mode?: boolean;
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

  // Initialize from localStorage on mount
  useEffect(() => {
    // Check both old and new token keys for backwards compatibility
    const storedToken = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    const storedEnquiryMode = localStorage.getItem("enquiry_mode");

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
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("enquiry_mode");
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

  const logout = () => {
    setUser(null);
    setToken(null);
    setEnquiryModeState(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("currency");
    localStorage.removeItem("enquiry_mode");
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
