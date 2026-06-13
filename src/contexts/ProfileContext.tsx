import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getClientProfile, ClientProfile } from "@/services/profile";
import { useAuth } from "./AuthContext";

interface ProfileContextType {
  profile: ClientProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  isRestaurant: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token, isAuthenticated } = useAuth();

  const fetchProfile = async () => {
    // Only fetch if we have an admin token and are not on the login page
    const adminToken = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
    if (!adminToken || window.location.pathname === "/login") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getClientProfile();
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const isRestaurant = profile?.business_type?.map((t) => t.toLowerCase()).includes("restaurant") ?? false;

  const contextValue = useMemo<ProfileContextType>(
    () => ({
      profile,
      isLoading,
      refreshProfile,
      isRestaurant,
    }),
    [profile, isLoading, isRestaurant]
  );

  return (
    <ProfileContext.Provider
      value={contextValue}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
