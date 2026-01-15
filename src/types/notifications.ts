export type NotificationType = 'NEW_ORDER' | 'NEW_ENQUIRY' | 'ORDER_STATUS_UPDATE' | 'CUSTOM' | 'TEST';

export type NotificationSoundType = 'beep' | 'chime' | 'bell' | 'ding' | 'pop';

export interface NotificationData {
  type: NotificationType;
  data: {
    title: string;
    message: string;
    orderId?: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    totalAmount?: number;
    itemCount?: number;
    clientName?: string;
    enquiryId?: string;
    customData?: any;
  };
  timestamp: string;
  id: string;
  read?: boolean;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  soundType: NotificationSoundType;
  soundDuration: number;
  showToast: boolean;
  autoHideToast: boolean;
  toastDuration: number;
}

export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

export interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  settings: NotificationSettings;
  connectionStatus: ConnectionStatus;
}