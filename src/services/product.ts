import axiosInstance from "./axiosInstance";
export const getProduct = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/products?sub_domain_name=abc`);

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching products";

    console.error("Error fetching products:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const addProduct = async (data: any) => {
  try {
    const response = await axiosInstance.post("/api/v1/products", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating products";

    console.error("Error updating products:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const updateProduct = async (productId: string, data: any) => {
  try {
    const response = await axiosInstance.put(
      `/api/v1/products/${productId}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while changing the product ";
    console.error("Error changing product :", errorMessage);

    throw new Error(errorMessage);
  }
};

export const deleteProduct = async (productId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/v1/products/${productId}`);

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while deleting the product";
    console.error("Error deleting product:", errorMessage);

    throw new Error(errorMessage);
  }
};


export const getProductList = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/products?sub_domain_name=abc`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching products";
    console.error("Error fetching products:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const uploadProductImages = async (formData: FormData) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/product-images",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while uploading product images";
    console.error("Error uploading product images:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const getProductImages = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/products/images`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching product images";
    console.error("Error fetching product images:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const deleteProductImage = async (imageId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/v1/products/images/${imageId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while deleting the image";
    console.error("Error deleting image:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const changeStatus = async (productId: string, ) => {
  try {
    const response = await axiosInstance.patch(
      `/api/v1/products/${productId}/status`,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while changing the product ";
    console.error("Error changing product :", errorMessage);

    throw new Error(errorMessage);
  }
};