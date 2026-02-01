import axiosInstance from "./axiosInstance";

export interface ZohoConfig {
  zoho_enabled: boolean;
  zoho_organization_id?: string;
  zoho_organization_name?: string;
  has_credentials: boolean;
  token_valid: boolean;
  token_expiry?: string;
}

export interface ZohoOrganization {
  organization_id: string;
  name: string;
  currency_code: string;
  currency_symbol?: string;
}

export interface ZohoSyncStats {
  total: number;
  synced: number;
  failed: number;
  pending: number;
}

export interface OrderWithZoho {
  _id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  createdAt: string;
  zoho_sync_status: "not_synced" | "synced" | "failed";
  zoho_salesorder_id?: string;
  zoho_sync_error?: string;
}

export interface CustomerSyncStats {
  synced: number;
  total: number;
}

// ============ OAuth Flow Methods ============

// Get current Zoho configuration status
export const getZohoConfig = async () => {
  const response = await axiosInstance.get<ZohoConfig>("/api/v1/zoho/config");
  return response.data;
};

// Generate OAuth authorization URL
export const generateAuthUrl = async (data: {
  client_id: string;
  redirect_uri: string;
}) => {
  const response = await axiosInstance.post<{ auth_url: string }>(
    "/api/v1/zoho/auth-url",
    data
  );
  return response.data;
};

// Exchange authorization code for tokens
export const exchangeCode = async (data: {
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}) => {
  const response = await axiosInstance.post("/api/v1/zoho/exchange-code", data);
  return response.data;
};

// Test connection and get organizations
export const testConnection = async () => {
  const response = await axiosInstance.post<{
    organizations: ZohoOrganization[];
  }>("/api/v1/zoho/test-connection");
  return response.data;
};

// Update Zoho configuration
export const updateZohoConfig = async (config: {
  zoho_organization_id?: string;
  zoho_enabled?: boolean;
}) => {
  const response = await axiosInstance.patch<ZohoConfig>(
    "/api/v1/zoho/config",
    config
  );
  return response.data;
};

// Disconnect Zoho (disable sync)
export const disconnectZoho = async () => {
  const response = await axiosInstance.patch("/api/v1/zoho/config", {
    zoho_enabled: false,
  });
  return response.data;
};

// ============ Sync Methods ============

// Get orders with Zoho sync status
export const getOrdersWithZohoStatus = async (
  page: number = 1,
  limit: number = 20,
  status?: "synced" | "failed" | "not_synced"
) => {
  const params: any = { page, limit };
  if (status) {
    params.zoho_sync_status = status;
  }
  const response = await axiosInstance.get<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    orders: OrderWithZoho[];
  }>("/api/v1/orders", { params });
  return response.data;
};

// Get Zoho sync statistics
export const getZohoSyncStats = async () => {
  const response = await axiosInstance.get<ZohoSyncStats>(
    "/api/v1/orders/zoho/stats"
  );
  return response.data;
};

// Manually sync an order to Zoho
export const syncOrderToZoho = async (orderId: string) => {
  const response = await axiosInstance.post(
    `/api/v1/orders/${orderId}/sync-zoho`
  );
  return response.data;
};

// Manually sync all pending orders
export const syncAllOrders = async () => {
  const response = await axiosInstance.post("/api/v1/orders/sync-all-zoho");
  return response.data;
};

// Get customer sync statistics
export const getCustomerSyncStats = async () => {
  const response = await axiosInstance.get<CustomerSyncStats>(
    "/api/v1/customers/zoho/stats"
  );
  return response.data;
};
