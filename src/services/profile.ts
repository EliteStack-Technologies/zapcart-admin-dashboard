import axiosInstance from "./axiosInstance";

export interface ClientProfile {
  _id: string;
  customer_name: string;
  email: string;
  phone_number?: string;
  business_name?: string;
  business_type?: string;
  sub_domain_name?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
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

export const getClientProfile = async () => {
  const response = await axiosInstance.get<ClientProfileResponse>("/api/v1/clients/me");
  return response.data.client;
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
