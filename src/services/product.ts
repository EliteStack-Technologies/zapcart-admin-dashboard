import { getSubdomain } from "@/utils/getSubdomain";
import axiosInstance from "./axiosInstance";
const sub_domain= getSubdomain()

export const getProduct = async (page = 1, limit = 10, search?: string, filters?: { category_id?: string; offer_id?: string; status?: string }, sortBy?: string) => {
  try {
    let url = `/api/v1/products?sub_domain_name=${sub_domain}&page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (filters?.category_id && filters.category_id !== 'all') {
      url += `&category_id=${encodeURIComponent(filters.category_id)}`;
    }
    if (filters?.offer_id && filters.offer_id !== 'all') {
      url += `&offer_id=${encodeURIComponent(filters.offer_id)}`;
    }
    if (filters?.status && filters.status !== 'all') {
      url += `&status=${encodeURIComponent(filters.status)}`;
    }
    if (sortBy && sortBy !== 'none') {
      url += `&sortBy=${encodeURIComponent(sortBy)}`;
    }
    const response = await axiosInstance.get(url);
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
    const response = await axiosInstance.get(`/api/v1/products?sub_domain_name=${sub_domain}`);
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

export const updatePriceVisibility = async (productId: string) => {
  try {
    const response = await axiosInstance.patch(
      `/api/v1/products/${productId}/price-visibility`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating price visibility";

    console.error("Error updating price visibility:", errorMessage);
    throw new Error(errorMessage);
  }
};