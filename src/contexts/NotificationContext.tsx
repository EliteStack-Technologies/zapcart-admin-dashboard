import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { NotificationData, NotificationSettings, ConnectionStatus, NotificationState } from '@/types/notifications';
import { NotificationStorageService } from '@/services/notificationStorage';
import socketService from '@/services/socketService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { RestaurantNotificationPopup } from '@/components/RestaurantNotificationPopup';

interface NotificationContextType extends NotificationState {
  // Actions
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  sendTestNotification: () => void;
  
  // WebSocket actions
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  reconnectWebSocket: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  serverUrl?: string;
  onNavigate?: (path: string) => void;
}

export function NotificationProvider({ children, serverUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000', onNavigate }: NotificationProviderProps) {
  const { toast } = useToast();
  const { isRestaurant } = useAuth();
  const { profile } = useProfile();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(NotificationStorageService.getSettings());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnectAttempts: 0,
  });
  // Store multiple popups for restaurants
  const [restaurantPopupNotifications, setRestaurantPopupNotifications] = useState<NotificationData[]>([]);
  
  // Track if audio has been enabled by user interaction
  const audioEnabledRef = useRef<boolean>(false);
  const audioPromptShownRef = useRef<boolean>(false);
  
  // Simple audio enablement check
  const checkAndEnableAudio = useCallback(async () => {
    if (audioEnabledRef.current) return true;
    
    try {
      // Create a simple audio element with very short beep
      const audio = new Audio('data:audio/wav;base64,UklGRn4AAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWoAAAC8tbNJtTm1c7SaupC1M7WTs4Cqp7pjqHCqi6h+qZqrqayiqJWrkKeGrKeroq2qraKpWa3Ir7yxrqsAAAAAAAE=');
      audio.volume = 0.01; // Very quiet
      const playPromise = audio.play();
      
      if (playPromise instanceof Promise) {
        await playPromise;
      }
      
      audio.pause();
      audio.currentTime = 0;
      audioEnabledRef.current = true;
      return true;
    } catch (error) {
      // If we can't play audio and haven't shown the prompt yet
      if (!audioPromptShownRef.current) {
        audioPromptShownRef.current = true;
        // Show toast to inform user
        toast({
          title: "Enable Audio",
          description: "Click anywhere to enable notification sounds",
          duration: 5000,
        });
      }
      return false;
    }
  }, [toast]);

  // Load notifications from storage on mount
  useEffect(() => {
    const storedNotifications = NotificationStorageService.getNotifications();
    setNotifications(storedNotifications);
  }, []);

  // Set up audio enablement listeners  
  useEffect(() => {
    // Try to enable audio immediately
    checkAndEnableAudio();
    
    // Set up one-time listeners for user interactions
    const enableAudioOnInteraction = () => {
      checkAndEnableAudio();
    };

    // Add listeners that only trigger once each
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, enableAudioOnInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, enableAudioOnInteraction);
      });
    };
  }, [checkAndEnableAudio]);

  // Play notification sound
  const playNotificationSound = useCallback(async () => {
    if (!settings.soundEnabled) return;
    
    // Ensure audio is enabled first
    const audioEnabled = await checkAndEnableAudio();
    if (!audioEnabled) return;
    
    try {
      // Create fresh audio context each time to ensure it works
      let audioContext: AudioContext;
      
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // If audio context is suspended, try to resume it
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // If still suspended after resume attempt, fail gracefully
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
      
      // Different sound types with different frequencies and patterns
      const soundConfigs = {
        beep: {
          frequency: 800,
          type: 'sine' as OscillatorType,
          pattern: [{ freq: 800, time: 0 }]
        },
        chime: {
          frequency: 800,
          type: 'sine' as OscillatorType,
          pattern: [
            { freq: 800, time: 0 },
            { freq: 1000, time: 0.1 },
            { freq: 600, time: 0.2 }
          ]
        },
        bell: {
          frequency: 900,
          type: 'triangle' as OscillatorType,
          pattern: [{ freq: 900, time: 0 }]
        },
        ding: {
          frequency: 1200,
          type: 'sine' as OscillatorType,
          pattern: [
            { freq: 1200, time: 0 },
            { freq: 800, time: 0.05 }
          ]
        },
        pop: {
          frequency: 600,
          type: 'square' as OscillatorType,
          pattern: [{ freq: 600, time: 0 }]
        }
      };

      const config = soundConfigs[settings.soundType] || soundConfigs.chime;
      oscillator.type = config.type;
      
      const duration = settings.soundDuration / 1000; // Convert ms to seconds
      
      // Apply frequency pattern
      config.pattern.forEach((step, index) => {
        const time = audioContext.currentTime + step.time;
        if (index === 0) {
          oscillator.frequency.setValueAtTime(step.freq, time);
        } else {
          oscillator.frequency.exponentialRampToValueAtTime(step.freq, time);
        }
      });
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      // Close audio context after sound plays to clean up
      setTimeout(() => {
        audioContext.close().catch(() => {});
      }, (duration + 0.1) * 1000);
      
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [settings.soundEnabled, settings.soundType, settings.soundDuration, checkAndEnableAudio]);

  // Handle new notifications
  const handleNewNotification = useCallback((notification: NotificationData) => {
    // Add to storage and state
    const updatedNotifications = NotificationStorageService.addNotification(notification);
    setNotifications(updatedNotifications);

    // Show restaurant popup for restaurant businesses (multiple popups)
    if (isRestaurant && (notification.type === 'NEW_ORDER' || notification.type === 'NEW_ENQUIRY')) {
      setRestaurantPopupNotifications(prev => [...prev, notification]);
    }

    // Play sound
    if (settings.soundEnabled) {
      playNotificationSound();
    }

    // Show toast notification
    if (settings.showToast) {
      toast({
        title: notification.data.title,
        description: notification.data.message,
        duration: settings.autoHideToast ? settings.toastDuration : undefined,
      });
    }
  }, [settings, playNotificationSound, toast, isRestaurant]);

  // Handle connection status changes
  const handleConnectionStatus = useCallback(() => {
    const isConnected = socketService.getConnectionStatus();
    setConnectionStatus(prev => ({
      ...prev,
      connected: isConnected,
      reconnectAttempts: 0, // Reset attempts since we're using simplified service
      lastConnected: isConnected ? new Date() : prev.lastConnected,
    }));
  }, []);

  // Setup WebSocket connection
  const connectWebSocket = useCallback(() => {
    socketService.onNotification('notification-context', handleNewNotification);
    socketService.onConnectionStatusChange(handleConnectionStatus);
    socketService.connect();
    
    // Authenticate with client ID after connection
    const clientId = profile?._id;
    if (clientId) {
      // Add a small delay to ensure connection is established
      setTimeout(() => {
        socketService.authenticate(clientId);
      }, 1000);
    }
    
    handleConnectionStatus();
  }, [handleNewNotification, handleConnectionStatus, profile?._id]);

  const disconnectWebSocket = useCallback(() => {
    socketService.offNotification('notification-context');
    socketService.disconnect();
    handleConnectionStatus();
  }, [handleConnectionStatus]);

  const reconnectWebSocket = useCallback(() => {
    socketService.reconnect();
    handleConnectionStatus();
  }, [handleConnectionStatus]);

  // Authenticate when profile becomes available or socket connects
  useEffect(() => {
    const clientId = profile?._id;
    const isSocketConnected = socketService.getConnectionStatus();
    
    if (clientId && isSocketConnected) {
      // Add a small delay to ensure socket is fully ready
      setTimeout(() => {
        socketService.authenticate(clientId);
      }, 500);
    }
  }, [profile?._id, connectionStatus.connected]); // React to both profile and connection changes

  // Connect on mount and cleanup on unmount
  useEffect(() => {
    // Always register the callbacks regardless of connection status
    socketService.onNotification('notification-context', handleNewNotification);
    socketService.onConnectionStatusChange(handleConnectionStatus);
    
    // Connect if not already connected
    if (!socketService.getConnectionStatus()) {
      socketService.connect();
    }
    
    // Update status immediately
    handleConnectionStatus();

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      socketService.disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      socketService.offNotification('notification-context');
      socketService.offConnectionStatusChange();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleNewNotification, handleConnectionStatus]); // Remove dependencies to prevent reconnections

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

  const sendTestNotification = useCallback(() => {
    socketService.sendTestNotification();
  }, []);

  // Remove a popup by id
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
    connectionStatus,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    updateSettings,
    sendTestNotification,
    connectWebSocket,
    disconnectWebSocket,
    reconnectWebSocket,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
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