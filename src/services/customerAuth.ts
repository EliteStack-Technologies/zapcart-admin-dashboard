import axiosInstance from "./axiosInstance";

export interface CustomerProfile {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  login_enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLoginResponse {
  token: string;
  customer: CustomerProfile;
}

export interface CustomerOrder {
  _id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  items: any[];
  subtotal: number;
  shipping_charge?: number;
  discount?: number;
  total_amount: number;
  order_status: string;
  priority?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrdersResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  orders: CustomerOrder[];
}

// Customer Auth APIs
export const customerLogin = async (phone: string, password: string, sub_domain_name: string) => {
  const response = await axiosInstance.post<CustomerLoginResponse>("/api/v1/customer-auth/login", {
    phone,
    password,
    sub_domain_name,
  });
  return response.data;
};

export const getCustomerProfile = async () => {
  const response = await axiosInstance.get<CustomerProfile>("/api/v1/customer-auth/profile");
  return response.data;
};

export const updateCustomerPassword = async (currentPassword: string, newPassword: string) => {
  const response = await axiosInstance.patch("/api/v1/customer-auth/password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const getCustomerOrders = async (page: number = 1, limit: number = 10, status?: string) => {
  const params: any = { page, limit };
  if (status && status !== "all") {
    params.order_status = status;
  }
  const response = await axiosInstance.get<CustomerOrdersResponse>("/api/v1/customer-auth/orders", { params });
  return response.data;
};

export const getCustomerOrderById = async (orderId: string) => {
  const response = await axiosInstance.get<CustomerOrder>(`/api/v1/customer-auth/orders/${orderId}`);
  return response.data;
};

// Admin APIs for Customer Management
export const adminSetCustomerPassword = async (customerId: string, password: string) => {
  const response = await axiosInstance.post("/api/v1/customer-auth/set-password", {
    customer_id: customerId,
    password,
  });
  return response.data;
};

export const adminToggleCustomerLogin = async (customerId: string, enabled: boolean) => {
  const response = await axiosInstance.patch("/api/v1/customer-auth/toggle-login", {
    customer_id: customerId,
    enabled: enabled,
  });
  return response.data;
};

export const getCustomerLoginStatus = async (customerId: string) => {
  const response = await axiosInstance.get(`/api/v1/customer-auth/login-status`, {
    params: { customer_id: customerId },
  });
  return response.data;
};
