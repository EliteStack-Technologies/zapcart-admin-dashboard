import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { NotificationData, NotificationSettings, NotificationState } from '@/types/notifications';
import { NotificationStorageService } from '@/services/notificationStorage';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { RestaurantNotificationPopup } from '@/components/RestaurantNotificationPopup';

interface NotificationContextType extends NotificationState {
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  onNavigate?: (path: string) => void;
}

export function NotificationProvider({ children, onNavigate }: NotificationProviderProps) {
  const { toast } = useToast();
  const { isRestaurant, isAuthenticated, isLoading } = useAuth();
  const { profile } = useProfile();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(NotificationStorageService.getSettings());

  // Store multiple popups for restaurants
  const [restaurantPopupNotifications, setRestaurantPopupNotifications] = useState<NotificationData[]>([]);

  // Track if audio has been enabled by user interaction
  const audioEnabledRef = useRef<boolean>(false);
  const audioPromptShownRef = useRef<boolean>(false);

  // Simple audio enablement check
  const checkAndEnableAudio = useCallback(async () => {
    if (audioEnabledRef.current) {
      return true;
    }
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRn4AAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWoAAAC8tbNJtTm1c7SaupC1M7WTs4Cqp7pjqHCqi6h+qZqrqayiqJWrkKeGrKeroq2qraKpWa3Ir7yxrqsAAAAAAAE=');
      audio.volume = 0.01;
      const playPromise = audio.play();
      if (playPromise instanceof Promise) {
        await playPromise;
      }
      audio.pause();
      audio.currentTime = 0;
      audioEnabledRef.current = true;
      return true;
    } catch (error) {
      if (!audioPromptShownRef.current) {
        audioPromptShownRef.current = true;
      }
      return false;
    }
  }, []);

  // Load notifications from storage on mount
  useEffect(() => {
    const storedNotifications = NotificationStorageService.getNotifications();
    setNotifications(storedNotifications);
  }, []);

  // Set up audio enablement listeners only after login or on refresh if authenticated
  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }
    checkAndEnableAudio();

    const enableAudioOnInteraction = () => {
      checkAndEnableAudio();
    };
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, enableAudioOnInteraction, { once: true, passive: true });
    });
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, enableAudioOnInteraction);
      });
    };
  }, [checkAndEnableAudio, isAuthenticated, isLoading]);

  // Show audio popup immediately after login
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (!prevAuthRef.current && isAuthenticated && !isLoading) {
      audioEnabledRef.current = false;
      audioPromptShownRef.current = false;
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading]);

  // Play notification sound
  const playNotificationSound = useCallback(async () => {
    if (!settings.soundEnabled) return;

    const audioEnabled = await checkAndEnableAudio();
    if (!audioEnabled) return;

    try {
      let audioContext: AudioContext;

      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        if (audioContext.state === 'suspended') {
          audioContext.close().catch(() => {});
          return;
        }
      } catch (error) {
        console.warn('Could not create or resume audio context:', error);
        return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const soundConfigs = {
        beep:  { frequency: 800,  type: 'sine'     as OscillatorType, pattern: [{ freq: 800,  time: 0 }] },
        chime: { frequency: 800,  type: 'sine'     as OscillatorType, pattern: [{ freq: 800, time: 0 }, { freq: 1000, time: 0.1 }, { freq: 600, time: 0.2 }] },
        bell:  { frequency: 900,  type: 'triangle' as OscillatorType, pattern: [{ freq: 900,  time: 0 }] },
        ding:  { frequency: 1200, type: 'sine'     as OscillatorType, pattern: [{ freq: 1200, time: 0 }, { freq: 800, time: 0.05 }] },
        pop:   { frequency: 600,  type: 'square'   as OscillatorType, pattern: [{ freq: 600,  time: 0 }] },
      };

      const config = soundConfigs[settings.soundType] || soundConfigs.chime;
      oscillator.type = config.type;

      const duration = settings.soundDuration / 1000;

      config.pattern.forEach((step, index) => {
        const time = audioContext.currentTime + step.time;
        if (index === 0) {
          oscillator.frequency.setValueAtTime(step.freq, time);
        } else {
          oscillator.frequency.exponentialRampToValueAtTime(step.freq, time);
        }
      });

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      setTimeout(() => {
        audioContext.close().catch(() => {});
      }, (duration + 0.1) * 1000);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [settings.soundEnabled, settings.soundType, settings.soundDuration, checkAndEnableAudio]);

  // Handle new notifications (called externally, e.g. from FCM foreground handler if wired up)
  const handleNewNotification = useCallback((notification: NotificationData) => {
    const updatedNotifications = NotificationStorageService.addNotification(notification);
    setNotifications(updatedNotifications);

    if (isRestaurant && (notification.type === 'NEW_ORDER' || notification.type === 'NEW_ENQUIRY')) {
      setRestaurantPopupNotifications(prev => [...prev, notification]);
    }

    if (settings.soundEnabled) {
      playNotificationSound();
    }

    if (settings.showToast) {
      toast({
        title: notification.data.title,
        description: notification.data.message,
        duration: settings.autoHideToast ? settings.toastDuration : undefined,
      });
    }
  }, [settings, playNotificationSound, toast, isRestaurant]);

  // Actions
  const markAsRead = useCallback((notificationId: string) => {
    const updatedNotifications = NotificationStorageService.markAsRead(notificationId);
    setNotifications(updatedNotifications);
  }, []);

  const markAllAsRead = useCallback(() => {
    const updatedNotifications = NotificationStorageService.markAllAsRead();
    setNotifications(updatedNotifications);
  }, []);

  const clearAllNotifications = useCallback(() => {
    NotificationStorageService.clearAllNotifications();
    setNotifications([]);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    NotificationStorageService.saveSettings(updated);
  }, [settings]);

  const handleCloseRestaurantPopup = useCallback((id: string) => {
    setRestaurantPopupNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleNavigateFromPopup = useCallback((path: string) => {
    onNavigate?.(path);
  }, [onNavigate]);

  const unreadCount = NotificationStorageService.getUnreadCount(notifications);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    updateSettings,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Audio Enablement Popup */}
   
      {restaurantPopupNotifications.map((notification, idx) => (
        <React.Fragment key={notification.id}>
          <RestaurantNotificationPopup
            notification={notification}
            isTopmost={idx === restaurantPopupNotifications.length - 1}
            onClose={() => handleCloseRestaurantPopup(notification.id)}
            onNavigate={handleNavigateFromPopup}
          />
        </React.Fragment>
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}