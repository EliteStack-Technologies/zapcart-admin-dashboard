import axiosInstance from "./axiosInstance";

export interface OrderItem {
  _id: string;
  product_id: {
    _id: string;
    title: string;
    actual_price?: number;
    image: string;
  };
  title: string;
  price: number;
  offer_price?: number;
  quantity: number;
  product_code?: string;
}

export interface Order {
  _id: string;
  client_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  shipping_charge?: number;
  discount?: number;
  total_amount: number;
  order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  priority?: "low" | "medium" | "high";
  notes?: string;
  cancellation_reason?: string;
  product_code?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface OrdersResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  orders: Order[];
}

export const getOrders = async (page: number = 1, limit: number = 10, status?: string, priority?: string) => {
  const params: any = { page, limit };
  if (status) {
    params.order_status = status;
  }
  if (priority) {
    params.priority = priority;
  }
  const response = await axiosInstance.get<OrdersResponse>("/api/v1/orders", { params });
  return response.data;
};

export const getOrderById = async (orderId: string) => {
  const response = await axiosInstance.get<Order>(`/api/v1/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId: string, status: string, cancellation_reason?: string) => {
  const payload: any = { order_status: status };
  if (cancellation_reason) {
    payload.cancellation_reason = cancellation_reason;
  }
  const response = await axiosInstance.patch(`/api/v1/orders/${orderId}/status`, payload);
  return response.data;
};

export const deleteOrder = async (orderId: string) => {
  const response = await axiosInstance.delete(`/api/v1/orders/${orderId}`);
  return response.data;
};

export const updateOrderItems = async (orderId: string, items: { product_id: string; title: string; price: number; quantity: number; product_code?: string }[], notes?: string, shipping_charge?: number, discount?: number) => {
  const payload: any = { items };
  if (notes !== undefined) payload.notes = notes;
  if (shipping_charge !== undefined) payload.shipping_charge = shipping_charge;
  if (discount !== undefined) payload.discount = discount;
  const response = await axiosInstance.put(`/api/v1/orders/${orderId}`, payload);
  return response.data;
};

export const getOrderTimeTracking = async (orderId: string) => {
  const response = await axiosInstance.get(`/api/v1/orders/${orderId}/time-tracking`);
  return response.data;
};

export const updateOrderPriority = async (orderId: string, priority: "low" | "medium" | "high") => {
  const response = await axiosInstance.patch(`/api/v1/orders/${orderId}/priority`, { priority });
  return response.data;
};
