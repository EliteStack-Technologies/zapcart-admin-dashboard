import axiosInstance from "./axiosInstance";

export interface DeliveryAgent {
  _id: string;
  client_id: string;
  name: string;
  phone_number: string;
  email: string;
  status: "active" | "inactive";
  vehicle_type?: string;
  vehicle_number?: string;
  delivered_orders_count?: number;
  createdAt: string;
  updatedAt: string;
}

export const getDeliveryAgents = async () => {
  const response = await axiosInstance.get("/api/v1/delivery-agents");
  return response.data;
};

export const createDeliveryAgent = async (data: Partial<DeliveryAgent> & { password?: string }) => {
  const response = await axiosInstance.post("/api/v1/delivery-agents", data);
  return response.data;
};

export const updateDeliveryAgent = async (id: string, data: Partial<DeliveryAgent> & { password?: string }) => {
  const response = await axiosInstance.put(`/api/v1/delivery-agents/${id}`, data);
  return response.data;
};

export const deleteDeliveryAgent = async (id: string) => {
  const response = await axiosInstance.delete(`/api/v1/delivery-agents/${id}`);
  return response.data;
};

export const getDeliveryStats = async () => {
  const response = await axiosInstance.get("/api/v1/delivery-agents/stats/overview");
  return response.data;
};

export const getAllDeliveries = async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
  const response = await axiosInstance.get("/api/v1/delivery-agents/orders/all", { params });
  return response.data;
};

