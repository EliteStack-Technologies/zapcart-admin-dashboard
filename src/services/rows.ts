import axiosInstance from "./axiosInstance";

export const getSections = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/sections`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching sections";

    console.error("Error fetching sections:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const addSection = async (data: any) => {
  try {
    const response = await axiosInstance.post("/api/v1/sections", data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while adding section";

    console.error("Error adding section:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const updateSection = async (sectionId: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/api/v1/sections/${sectionId}`, data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating section";

    console.error("Error updating section:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const deleteSection = async (sectionId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/v1/sections/${sectionId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while deleting section";

    console.error("Error deleting section:", errorMessage);
    throw new Error(errorMessage);
  }
};
