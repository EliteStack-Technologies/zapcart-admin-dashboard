import axiosInstance from "./axiosInstance";
export const getAccountDetails = async () => {
  try {
    const response = await axiosInstance.get("/api/v1/account-details");

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching account details";

    console.error("Error fetching account details:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const updateAccountDetails = async (details: any) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/account-details",
      details
    );  
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating account details";

    console.error("Error updating account details:", errorMessage);

    throw new Error(errorMessage);
  }
};