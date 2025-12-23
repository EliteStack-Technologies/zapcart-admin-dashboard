import axiosInstance from "./axiosInstance";

export interface ClientProfile {
  _id: string;
  client_name: string;
  email: string;
  phone_number?: string;
  business_name?: string;
  business_type?: string;
  sub_domain_name?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  price_visibility?: boolean;
  currency_id?: {
    _id: string;
    name: string;
    symbol: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  _id: string;
  name: string;
  symbol: string;
  code: string;
}

export interface ClientProfileResponse {
  message: string;
  client: ClientProfile;
}

// Cache for profile data to prevent multiple API calls
let profileCache: ClientProfile | null = null;
let profileFetchPromise: Promise<ClientProfile> | null = null;

// Helper to clear cache when needed (e.g., after updates)
export const clearProfileCache = () => {
  profileCache = null;
  profileFetchPromise = null;
};

export const getClientProfile = async (forceRefresh = false) => {
  // Return cached data if available and not forcing refresh
  if (profileCache && !forceRefresh) {
    return profileCache;
  }

  // If a fetch is already in progress, return that promise
  if (profileFetchPromise) {
    return profileFetchPromise;
  }

  // Create new fetch promise
  profileFetchPromise = (async () => {
    try {
      const response = await axiosInstance.get<ClientProfileResponse>("/api/v1/clients/me");
      profileCache = response.data.client;
      return profileCache;
    } finally {
      // Clear the promise after completion (success or failure)
      profileFetchPromise = null;
    }
  })();

  return profileFetchPromise;
};

export const updateCurrency = async (currencyId: string) => {
  const response = await axiosInstance.put("/api/v1/clients/update-currency", {
    currency_id: currencyId,
  });
  return response.data;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await axiosInstance.post("/api/v1/clients/change-password", {
    oldPassword,
    newPassword,
  });
  return response.data;
};

export const getCurrencies = async () => {
  const response = await axiosInstance.get<Currency[]>("/api/v1/currencies");
  return response.data;
};

export const updateClientProfile = async (clientId: string, data: Partial<ClientProfile>) => {
  const response = await axiosInstance.patch(`/api/v1/clients/${clientId}`, data);
  return response.data;
};
