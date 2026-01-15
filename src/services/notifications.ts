import axiosInstance from './axiosInstance';

export interface NotificationApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Check notification system status
export const getNotificationStatus = async (): Promise<NotificationApiResponse> => {
  try {
    const response = await axiosInstance.get('/notifications/status');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to get notification status');
  }
};

// Send test notification
export const sendTestNotification = async (): Promise<NotificationApiResponse> => {
  try {
    const response = await axiosInstance.post('/notifications/test');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to send test notification');
  }
};

// Send custom notification (for admin use)
export const sendCustomNotification = async (data: {
  title: string;
  message: string;
  type?: string;
  targetRoom?: string;
}): Promise<NotificationApiResponse> => {
  try {
    const response = await axiosInstance.post('/notifications/custom', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to send custom notification');
  }
};