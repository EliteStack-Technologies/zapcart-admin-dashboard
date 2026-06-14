import axiosInstance from "./axiosInstance";

export interface RestaurantTable {
  _id: string;
  client_id: string;
  number: string;
  label?: string | null;
  status: "active" | "archived";
  wa_link?: string | null;
  qr_png_url?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TableStats {
  total: number;
  active: number;
  archived: number;
  qr_generated: number;
  qr_pending: number;
}

export interface GetTablesResponse {
  total: number;
  stats: TableStats;
  tables: RestaurantTable[];
}

export const getTables = async (status?: string): Promise<GetTablesResponse> => {
  const response = await axiosInstance.get("/api/v1/tables", {
    params: status ? { status } : undefined,
  });
  return response.data;
};

export const createTable = async (data: { number: string; label?: string }) => {
  const response = await axiosInstance.post("/api/v1/tables", data);
  return response.data;
};

export const bulkCreateTables = async (data: { count?: number; numbers?: string[] }) => {
  const response = await axiosInstance.post("/api/v1/tables/bulk", data);
  return response.data;
};

export const updateTable = async (id: string, data: { number?: string; label?: string }) => {
  const response = await axiosInstance.put(`/api/v1/tables/${id}`, data);
  return response.data;
};

export const toggleTableStatus = async (id: string) => {
  const response = await axiosInstance.patch(`/api/v1/tables/${id}/toggle-status`);
  return response.data;
};

export const deleteTable = async (id: string) => {
  const response = await axiosInstance.delete(`/api/v1/tables/${id}`);
  return response.data;
};

export const mintTableQr = async (id: string) => {
  const response = await axiosInstance.post(`/api/v1/tables/${id}/mint`);
  return response.data;
};

export const mintAllTablesQr = async () => {
  const response = await axiosInstance.post("/api/v1/tables/mint-all");
  return response.data;
};
