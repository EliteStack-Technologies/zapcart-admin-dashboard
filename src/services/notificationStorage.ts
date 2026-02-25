import { NotificationData, NotificationSettings } from '@/types/notifications';

const STORAGE_KEYS = {
  NOTIFICATIONS: 'admin_notifications',
  SETTINGS: 'notification_settings',
  LAST_READ: 'notifications_last_read',
  LAST_CLEARED: 'notifications_last_cleared',
};

const MAX_STORED_NOTIFICATIONS = 50;

const defaultSettings: NotificationSettings = {
  soundEnabled: true,
  soundType: 'pop',
  soundDuration: 500,
  showToast: true,
  autoHideToast: true,
  toastDuration: 5000,
};

export class NotificationStorageService {
  static getNotifications(): NotificationData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const notifications: NotificationData[] = stored ? JSON.parse(stored) : [];
      
      // Filter out notifications that were received before the last "Clear All"
      const lastCleared = this.getLastClearedAt();
      if (lastCleared) {
        return notifications.filter(n => new Date(n.timestamp).getTime() > lastCleared);
      }
      
      return notifications;
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
    const lastClearedAt = this.getLastClearedAt();
    if (lastClearedAt && new Date(notification.timestamp).getTime() <= lastClearedAt) {
      return this.getNotifications();
    }

    const existing = this.getNotifications();
    
    // Deduplicate by ID
    if (existing.some(n => n.id === notification.id)) {
      return existing;
    }

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
    localStorage.setItem(STORAGE_KEYS.LAST_CLEARED, new Date().toISOString());
  }

  static getLastClearedAt(): number | null {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_CLEARED);
    return stored ? new Date(stored).getTime() : null;
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