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
  quantity: number;
}

export interface Order {
  _id: string;
  client_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  total_amount: number;
  order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
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

export const getOrders = async (page: number = 1, limit: number = 10, status?: string) => {
  const params: any = { page, limit };
  if (status) {
    params.order_status = status;
  }
  const response = await axiosInstance.get<OrdersResponse>("/api/v1/orders", { params });
  return response.data;
};

export const getOrderById = async (orderId: string) => {
  const response = await axiosInstance.get<Order>(`/api/v1/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await axiosInstance.patch(`/api/v1/orders/${orderId}/status`, { order_status: status });
  return response.data;
};

export const deleteOrder = async (orderId: string) => {
  const response = await axiosInstance.delete(`/api/v1/orders/${orderId}`);
  return response.data;
};
