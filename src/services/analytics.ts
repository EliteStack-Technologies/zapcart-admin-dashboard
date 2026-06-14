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
  total_clients?: number;
  active_clients?: number;
  inactive_clients?: number;
  total_customers?: number;
  delivered_orders?: number;
  pending_delivery_orders?: number;
  total_delivery_agents?: number;
  active_delivery_agents?: number;
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
  clients_summary?: any[];
}

export const getAnalyticsOverview = async (isBranchAdmin: boolean = false): Promise<AnalyticsData> => {
  const endpoint = isBranchAdmin ? "/api/v1/branch-admins/dashboard" : "/api/v1/analytics/overview";
  
  const headers: any = {};
  if (isBranchAdmin) {
    const branchToken = localStorage.getItem("branch_admin_token");
    if (branchToken) {
      headers.Authorization = `Bearer ${branchToken}`;
    }
  }

  const response = await axiosInstance.get<any>(endpoint, { headers });
  const data = response.data;

  
  // Map branch-specific dashboard data to AnalyticsData format if needed
  if (isBranchAdmin && data.overview && !data.overview.total_revenue) {
    return {
      ...data,
      overview: {
        total_orders: data.overview.total_orders || 0,
        total_revenue: data.overview.total_sales || 0, // Map total_sales to total_revenue
        average_order_value: data.overview.total_sales / (data.overview.total_orders || 1) || 0,
        total_products: data.overview.total_products || 0,
        active_products: data.overview.active_clients || 0, // Map active_clients to active_products as a fallback
        inactive_products: data.overview.inactive_clients || 0,
        currency: data.overview.currency || { _id: "", name: "Default", symbol: "$", code: "USD" },
        total_clients: data.overview.total_clients || 0,
        active_clients: data.overview.active_clients || 0,
        inactive_clients: data.overview.inactive_clients || 0,
        total_customers: data.overview.total_customers || 0,
        delivered_orders: data.overview.delivered_orders || 0,
        pending_delivery_orders: data.overview.pending_delivery_orders || 0,
        total_delivery_agents: data.overview.total_delivery_agents || 0,
        active_delivery_agents: data.overview.active_delivery_agents || 0,
      },
      order_status_breakdown: data.order_status_breakdown || [],
      top_selling_products: data.top_selling_products || [],
      category_performance: data.category_performance || [],
      revenue_trend_7days: data.revenue_trend_7days || [],
      recent_orders: data.recent_orders || [],
    };
  }

  return data;
};
