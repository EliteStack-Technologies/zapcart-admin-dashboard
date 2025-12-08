import { getSubdomain } from "@/utils/getSubdomain";
import axiosInstance from "./axiosInstance";
const sub_domain= getSubdomain()
export const getBanners = async () => {
  try {
    const response = await axiosInstance.get(`/api/v1/banners?sub_domain_name=${sub_domain}`);

    return response.data.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while fetching banners";

    console.error("Error fetching banners:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const addBanners = async (data: any) => {
  try {
    const response = await axiosInstance.post("/api/v1/banners", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while updating banners";

    console.error("Error updating banners:", errorMessage);

    throw new Error(errorMessage);
  }
};

export const deleteBanner = async (bannerId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/v1/banners/${bannerId}`);

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

export const changeBannerStatus = async (bannerId: string,) => {
  try {
    const response = await axiosInstance.patch(
      `/api/v1/banners/${bannerId}/change-status`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An error occurred while changing the banner status";
    console.error("Error changing banner status:", errorMessage);

    throw new Error(errorMessage);
  }
};