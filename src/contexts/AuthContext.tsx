import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    // Check both old and new token keys for backwards compatibility
    const storedToken = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
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
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          // If user data is invalid, create a basic user object
          const basicUser: User = {
            id: `user_${Date.now()}`,
            email,
            name: email.split("@")[0],
            role: "admin",
          };
          setUser(basicUser);
          localStorage.setItem("user", JSON.stringify(basicUser));
        }
      } else {
        // Create a basic user object if not provided
        const basicUser: User = {
          id: `user_${Date.now()}`,
          email,
          name: email.split("@")[0],
          role: "admin",
        };
        setUser(basicUser);
        localStorage.setItem("user", JSON.stringify(basicUser));
      }

      return true;
    } catch (error) {
      console.error("Login sync error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        token,
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
