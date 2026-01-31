import axiosInstance from './axiosInstance';

// Types
export interface StockInEntry {
  _id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  reason: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface StockOutEntry {
  _id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  reason: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface LowStockItem {
  _id: string;
  product_id: number;
  title: string;
  stock_count: number;
}

export interface StockInRequest {
  product_id: string;
  quantity: number;
  reason: string;
}

export interface StockOutRequest {
  product_id: string;
  quantity: number;
  reason: string;
}

// Stock In APIs
export const addStockIn = async (data: StockInRequest): Promise<StockInEntry> => {
  const response = await axiosInstance.post('/api/v1/inventory/stock-in', data);
  return response.data;
};

export const getStockInHistory = async (): Promise<StockInEntry[]> => {
  const response = await axiosInstance.get('/api/v1/inventory/stock-in');
  return response.data;
};

// Stock Out APIs
export const addStockOut = async (data: StockOutRequest): Promise<StockOutEntry> => {
  const response = await axiosInstance.post('/api/v1/inventory/stock-out', data);
  return response.data;
};

export const getStockOutHistory = async (): Promise<StockOutEntry[]> => {
  const response = await axiosInstance.get('/api/v1/inventory/stock-out');
  return response.data;
};

// Low Stock API
export const getLowStock = async (): Promise<LowStockItem[]> => {
  const response = await axiosInstance.get('/api/v1/inventory/low-stock');
  return response.data;
};
