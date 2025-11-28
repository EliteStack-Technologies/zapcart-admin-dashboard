import axiosInstance from "./axiosInstance";
export const getProductImages = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/product-images?sub_domain_name=abc`);

    return response.data.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching product images";

    console.error("Error fetching product images:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const addProductImages = async (data: any) => {
  try {
    const response = await axiosInstance.post("/api/v1/product-images", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating product images";

    console.error("Error updating product images:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const deleteProductImage = async (productImageId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/v1/product-images/${productImageId}`);

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while deleting the banner";
    console.error("Error deleting banner:", errorMessage);

    throw new Error(errorMessage);
  }
};