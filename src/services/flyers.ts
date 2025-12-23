import axiosInstance from "./axiosInstance";

export interface Flyer {
  _id: string;
  flyer_id: number;
  client_id: string;
  title: string;
  description: string | null;
  pdf_url: string;
  file_size: number;
  status: "active" | "inactive";
  display_order: number;
  valid_from: string | null;
  valid_until: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface FlyersResponse {
  total: number;
  flyers: Flyer[];
}

export const flyerService = {
  // Get all flyers
  getFlyers: async (): Promise<FlyersResponse> => {
    const response = await axiosInstance.get<FlyersResponse>("/api/v1/flyers");
    return response.data;
  },

  // Create a new flyer
  createFlyer: async (formData: FormData): Promise<Flyer> => {
    const response = await axiosInstance.post<Flyer>("/api/v1/flyers", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete a flyer
  deleteFlyer: async (flyerId: string): Promise<void> => {
    await axiosInstance.delete(`/api/v1/flyers${flyerId}`);
  },

  // Update a flyer
  updateFlyer: async (flyerId: string, formData: FormData): Promise<Flyer> => {
    const response = await axiosInstance.put<Flyer>(
      `/api/v1/flyers/${flyerId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Update flyer status
  updateFlyerStatus: async (
    flyerId: string,
    status: "active" | "inactive"
  ): Promise<Flyer> => {
    const response = await axiosInstance.patch<Flyer>(
      `/api/v1/flyers/${flyerId}/status`,
      { status }
    );
    return response.data;
  },
};
