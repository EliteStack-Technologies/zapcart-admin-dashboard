import axiosInstance from "./axiosInstance";

export interface Currency {
  _id: string;
  name: string;
  symbol: string;
  code: string;
}

export interface Overview {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  total_products: number;
  active_products: number;
  inactive_products: number;
  currency: Currency;
}

export interface OrderStatusBreakdown {
  _id: string;
  count: number;
  total_amount: number;
}

export interface TopSellingProduct {
  _id: string;
  product_title: string;
  total_quantity: number;
  total_revenue: number;
}

export interface CategoryPerformance {
  _id: string;
  name: string;
  product_count: number;
  active_products: number;
}

export interface RevenueTrend {
  _id: string;
  daily_revenue: number;
  order_count: number;
}

export interface RecentOrder {
  _id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  order_status: string;
  createdAt: string;
}

export interface AnalyticsData {
  overview: Overview;
  order_status_breakdown: OrderStatusBreakdown[];
  top_selling_products: TopSellingProduct[];
  category_performance: CategoryPerformance[];
  revenue_trend_7days: RevenueTrend[];
  recent_orders: RecentOrder[];
}

export const getAnalyticsOverview = async (): Promise<AnalyticsData> => {
  const response = await axiosInstance.get<AnalyticsData>("/api/v1/analytics/overview");
  return response.data;
};
