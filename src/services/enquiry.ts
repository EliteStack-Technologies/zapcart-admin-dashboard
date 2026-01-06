import axiosInstance from "./axiosInstance";

export interface Enquiry {
  _id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: EnquiryItem[];
  subtotal: number;
  total_amount: number;
  status: string;
  enquiry_status?: string;
  converted_to_order?: string;
  converted_at?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryItem {
  product_id: {
    _id: string;
    title: string;
    image?: string;
    product_code?: string;
  };
  title: string;
  product_code?: string;
  quantity: number;
  price: number;
}

export interface EnquiriesResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  enquiries: Enquiry[];
}

export const getEnquiries = async (page: number = 1, limit: number = 25, search?: string) => {
  const params: any = { page, limit };
  if (search) {
    params.search = search;
  }
  const response = await axiosInstance.get<EnquiriesResponse>("/api/v1/enquiries", { params });
  return response.data;
};

export const getEnquiryById = async (id: string) => {
  const response = await axiosInstance.get<Enquiry>(`/api/v1/enquiries/${id}`);
  return response.data;
};

export const convertEnquiryToOrder = async (enquiryId: string) => {
  const response = await axiosInstance.post(`/api/v1/enquiries/${enquiryId}/convert-to-order`);
  return response.data;
};
