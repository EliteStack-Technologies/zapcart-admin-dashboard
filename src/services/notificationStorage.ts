import { NotificationData, NotificationSettings } from '@/types/notifications';

const STORAGE_KEYS = {
  NOTIFICATIONS: 'admin_notifications',
  SETTINGS: 'notification_settings',
  LAST_READ: 'notifications_last_read',
};

const MAX_STORED_NOTIFICATIONS = 50;

const defaultSettings: NotificationSettings = {
  soundEnabled: true,
  soundType: 'chime',
  soundDuration: 500,
  showToast: true,
  autoHideToast: true,
  toastDuration: 5000,
};

export class NotificationStorageService {
  static getNotifications(): NotificationData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
      return [];
    }
  }

  static saveNotifications(notifications: NotificationData[]): void {
    try {
      // Keep only the latest notifications to prevent storage bloat
      const limited = notifications.slice(0, MAX_STORED_NOTIFICATIONS);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  static addNotification(notification: NotificationData): NotificationData[] {
    const existing = this.getNotifications();
    const updated = [notification, ...existing];
    this.saveNotifications(updated);
    return updated;
  }

  static markAsRead(notificationId: string): NotificationData[] {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.saveNotifications(updated);
    return updated;
  }

  static markAllAsRead(): NotificationData[] {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    this.saveNotifications(updated);
    localStorage.setItem(STORAGE_KEYS.LAST_READ, new Date().toISOString());
    return updated;
  }

  static clearAllNotifications(): void {
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  }

  static getSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return defaultSettings;
    }
  }

  static saveSettings(settings: NotificationSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  static getUnreadCount(notifications: NotificationData[]): number {
    return notifications.filter(n => !n.read).length;
  }
}