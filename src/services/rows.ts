import axiosInstance from "./axiosInstance";

export const getRows = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/rows`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching rows";

    console.error("Error fetching rows:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const addRow = async (data: any) => {
  try {
    const response = await axiosInstance.post("/api/v1/rows", data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while adding row";

    console.error("Error adding row:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const updateRow = async (rowId: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/api/v1/rows/${rowId}`, data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating row";

    console.error("Error updating row:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const deleteRow = async (rowId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/v1/rows/${rowId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while deleting row";

    console.error("Error deleting row:", errorMessage);
    throw new Error(errorMessage);
  }
};
