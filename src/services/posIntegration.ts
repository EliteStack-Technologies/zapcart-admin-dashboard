import axiosInstance from "./axiosInstance";

/**
 * POS Integration service.
 *
 * Lets the admin connect a third-party POS, push ZapCart orders into it, and
 * pull POS-updated order statuses back into ZapCart.
 *
 * Mirrors the Zoho integration contract (see services/zoho.ts) so the backend
 * can expose a consistent set of endpoints under /api/v1/pos.
 */

export type PosProvider = "square" | "clover" | "petpooja" | "posist" | "custom";

export type PosSyncStatus = "not_synced" | "synced" | "failed";

export interface PosConfig {
  pos_enabled: boolean;
  provider?: PosProvider;
  /** Base URL of the third-party POS API. */
  api_base_url?: string;
  /** Friendly name of the connected store/location. */
  store_name?: string;
  store_id?: string;
  /** Whether valid credentials (API key / OAuth token) are stored on the server. */
  has_credentials: boolean;
  /** Whether the stored credentials are currently usable. */
  credentials_valid: boolean;
  /** Pull POS status updates back into ZapCart automatically. */
  auto_pull_status?: boolean;
  /** Push new ZapCart orders to the POS automatically. */
  auto_push_orders?: boolean;
  /** Inbound webhook URL the POS should call when an order status changes. */
  webhook_url?: string;
  last_synced_at?: string;
}

export interface PosStore {
  store_id: string;
  name: string;
  address?: string;
  currency_code?: string;
}

export interface PosSyncStats {
  summary: {
    total_orders: number;
    synced: number;
    failed: number;
    pending: number;
    sync_rate: string;
  };
  recent_syncs: {
    order_number: string;
    pos_order_id: string;
    status: string;
    synced_at: string;
    customer_name: string;
  }[];
  recent_failures: {
    order_number: string;
    error: string;
    failed_at: string;
    customer_name: string;
  }[];
}

export interface OrderWithPos {
  _id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  createdAt: string;
  /** ZapCart's own order status. */
  status?: string;
  /** Status reported back by the POS (e.g. "preparing", "ready", "completed"). */
  pos_status?: string;
  pos_sync_status: PosSyncStatus;
  pos_order_id?: string;
  pos_sync_error?: string;
  pos_last_synced_at?: string;
}

// ============ Configuration / Connection ============

/** Get the current POS configuration and connection status. */
export const getPosConfig = async () => {
  const response = await axiosInstance.get<PosConfig>("/api/v1/pos/config");
  return response.data;
};

/** Save / update POS credentials and connection settings. */
export const connectPos = async (data: {
  provider: PosProvider;
  api_base_url: string;
  api_key: string;
  api_secret?: string;
  store_id?: string;
}) => {
  const response = await axiosInstance.post<PosConfig>(
    "/api/v1/pos/connect",
    data
  );
  return response.data;
};

/** Verify stored credentials and list the available POS stores/locations. */
export const testPosConnection = async () => {
  const response = await axiosInstance.post<{ stores: PosStore[] }>(
    "/api/v1/pos/test-connection"
  );
  return response.data;
};

/** Update non-credential POS settings (toggles, selected store). */
export const updatePosConfig = async (config: Partial<PosConfig>) => {
  const response = await axiosInstance.patch<PosConfig>(
    "/api/v1/pos/config",
    config
  );
  return response.data;
};

/** Disconnect the POS and clear stored credentials. */
export const disconnectPos = async () => {
  const response = await axiosInstance.post("/api/v1/pos/disconnect");
  return response.data;
};

// ============ Order Sync ============

/** Get orders with their POS sync/status info. */
export const getOrdersWithPosStatus = async (
  page: number = 1,
  limit: number = 20,
  status?: PosSyncStatus
) => {
  const params: Record<string, unknown> = { page, limit };
  if (status) {
    params.pos_sync_status = status;
  }
  const response = await axiosInstance.get<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    orders: OrderWithPos[];
  }>("/api/v1/orders", { params });
  return response.data;
};

/** Get POS sync statistics. */
export const getPosSyncStats = async () => {
  const response = await axiosInstance.get<PosSyncStats>(
    "/api/v1/orders/pos/stats"
  );
  return response.data;
};

/** Push a single order to the POS. */
export const pushOrderToPos = async (orderId: string) => {
  const response = await axiosInstance.post(
    `/api/v1/orders/${orderId}/push-pos`
  );
  return response.data;
};

/** Push all pending orders to the POS. */
export const pushAllOrdersToPos = async () => {
  const response = await axiosInstance.post("/api/v1/orders/push-all-pos");
  return response.data;
};

/** Pull the latest status for a single order from the POS. */
export const pullOrderStatusFromPos = async (orderId: string) => {
  const response = await axiosInstance.post(
    `/api/v1/orders/${orderId}/pull-pos-status`
  );
  return response.data;
};

/** Pull the latest statuses for all synced orders from the POS. */
export const pullAllStatusesFromPos = async () => {
  const response = await axiosInstance.post("/api/v1/orders/pull-all-pos-status");
  return response.data;
};
