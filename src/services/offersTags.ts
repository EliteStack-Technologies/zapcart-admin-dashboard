import axiosInstance from "./axiosInstance";
export const getOfferTags = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/offer-tags`);

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching offers";

    console.error("Error fetching offers:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const addOffers = async (data: any) => {
  try {
    const response = await axiosInstance.post("/api/v1/offer-tags", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating offers";

    console.error("Error updating offers:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const updateOffer = async (offerId: string,data:any) => {
  try {
    const response = await axiosInstance.put(
      `/api/v1/offer-tags/${offerId}`,data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while changing the offer status";
    console.error("Error changing offer status:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const deleteOffer = async (offerId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/v1/offer-tags/${offerId}`);

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while deleting the offer";
    console.error("Error deleting offer:", errorMessage);

    throw new Error(errorMessage);
  }
};

