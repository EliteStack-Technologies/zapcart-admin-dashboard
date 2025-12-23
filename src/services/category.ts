import { getSubdomain } from "@/utils/getSubdomain";
import axiosInstance from "./axiosInstance";
const sub_domain= getSubdomain()

export const getCategory = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/categories?sub_domain_name=${sub_domain}`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching categories";

    console.error("Error fetching categories:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const addCategory = async (data: any) => {
  try {
    const response = await axiosInstance.post("/api/v1/categories", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating categories";

    console.error("Error updating categories:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const updateCategory = async (categoryId: string, data: any) => {
  try {
    const response = await axiosInstance.put(
      `/api/v1/categories/${categoryId}`,
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
      "An error occurred while changing the category status";
    console.error("Error changing category status:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const deleteCategory = async (categoryId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/v1/categories/${categoryId}`);

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while deleting the category";

    console.error("Error deleting category:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const getCategoryProducts = async (categoryId: string) => {
  try {
    const response = await axiosInstance.get(`/api/v1/categories/${categoryId}/products?sub_domain_name=${sub_domain}`);

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching category products";

    console.error("Error fetching category products:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const updateCategoryOrder = async (categories: Array<{ id: string; display_order: number }>) => {
  try {
    const response = await axiosInstance.patch(`/api/v1/categories/reorder`, {
      categories
    });

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating category order";

    console.error("Error updating category order:", errorMessage);

    throw new Error(errorMessage);
  }
};
