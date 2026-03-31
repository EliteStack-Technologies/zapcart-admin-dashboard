import axiosInstance from "./axiosInstance";

export interface DeliveryAgent {
  _id: string;
  name: string;
  phone_number: string;
  email: string;
  vehicle_type?: string;
  vehicle_number?: string;
  status: string;
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
