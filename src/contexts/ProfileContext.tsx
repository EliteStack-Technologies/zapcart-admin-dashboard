import React, { createContext, useContext, useEffect, useState } from "react";
import { getClientProfile, ClientProfile } from "@/services/profile";

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

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getClientProfile();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const isRestaurant = profile?.business_type?.toLowerCase() === "restaurant";

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        refreshProfile,
        isRestaurant,
      }}
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
