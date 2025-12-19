import axiosInstance from "./axiosInstance";

export interface Customer {
  _id: string;
  client_id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  total_orders: number;
  total_spent: number;
  last_order_date?: string | null;
  notes?: string | null;
  created_source: "manual" | "order";
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CustomersResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  customers: Customer[];
}

export interface CustomerOrdersResponse {
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    total_orders: number;
    total_spent: number;
    address?: string | null;
    last_order_date?: string | null;
  };
  orders: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: any[];
  };
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export const getCustomers = async (page: number = 1, limit: number = 10, search?: string) => {
  const params: any = { page, limit };
  if (search) {
    params.search = search;
  }
  const response = await axiosInstance.get<CustomersResponse>("/api/v1/customers", { params });
  return response.data;
};

export const getCustomerById = async (customerId: string) => {
  const response = await axiosInstance.get<Customer>(`/api/v1/customers/${customerId}`);
  return response.data;
};

export const getCustomerOrders = async (customerId: string, page: number = 1, limit: number = 10) => {
  const params = { page, limit };
  const response = await axiosInstance.get<CustomerOrdersResponse>(`/api/v1/customers/${customerId}/orders`, { params });
  return response.data;
};

export const createCustomer = async (data: CreateCustomerData) => {
  const response = await axiosInstance.post<Customer>("/api/v1/customers", data);
  return response.data;
};

export const updateCustomer = async (customerId: string, data: UpdateCustomerData) => {
  const response = await axiosInstance.put<Customer>(`/api/v1/customers/${customerId}`, data);
  return response.data;
};

export const deleteCustomer = async (customerId: string) => {
  const response = await axiosInstance.delete(`/api/v1/customers/${customerId}`);
  return response.data;
};
