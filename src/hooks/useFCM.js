import { useEffect, useRef, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/config/firebase';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const FCM_TOKEN_KEY = 'fcm_token';

// ─── Platform detection ──────────────────────────────────────────────────────
const isNative = Capacitor.isNativePlatform();

// ─── Backend helpers ──────────────────────────────────────────────────────────
async function registerTokenWithBackend(clientId, token) {
  const platform = isNative ? 'android' : 'web';
  const deviceLabel = `${isNative ? 'Android App' : 'Web Browser'} – ${navigator.userAgent.slice(0, 60)}`;

  const response = await fetch(`${API_BASE_URL}/api/v1/notifications/register-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, token, platform, deviceLabel }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`register-token failed: ${response.status} – ${body}`);
  }
  return response.json();
}

async function removeTokenFromBackend(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications/remove-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error(`remove-token failed: ${response.status}`);
  }
  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// registerFCMOnLogin
// ─────────────────────────────────────────────────────────────────────────────
export async function registerFCMOnLogin(clientId) {
  if (!clientId) return;

  try {
    const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (storedToken && (storedToken.startsWith('web-') || storedToken.startsWith('device-'))) {
      localStorage.removeItem(FCM_TOKEN_KEY);
    }

    if (isNative) {
      // ── Handle Native Platform (Android APK) ────────────────────────────────
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive !== 'granted') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
        // The token is actually received in the 'registration' listener in the hook below,
        // but for immediate registration on login, we might need to wait for it.
        // However, Capacitor usually persistent the token.
      }
    } else {
      // ── Handle Web Platform ─────────────────────────────────────────────────
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
      const swParams = new URLSearchParams({
        apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || '',
        authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || '',
        projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || '',
        storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '',
      });
      const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`;

      const swReg = await navigator.serviceWorker.register(swUrl);
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });

      if (token) {
        await registerTokenWithBackend(clientId, token);
        localStorage.setItem(FCM_TOKEN_KEY, token);
      }
    }
  } catch (err) {
    console.error('[FCM] registration error:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// removeFCMTokenOnLogout
// ─────────────────────────────────────────────────────────────────────────────
export async function removeFCMTokenOnLogout() {
  const token = localStorage.getItem(FCM_TOKEN_KEY);
  if (!token) return;

  try {
    await removeTokenFromBackend(token);
  } catch (err) {
    console.warn('[FCM] Could not remove token from backend:', err);
  } finally {
    localStorage.removeItem(FCM_TOKEN_KEY);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// useFCM hook
// ─────────────────────────────────────────────────────────────────────────────
export function useFCM({ onMessage: onForegroundMessage }) {
  const messagingRef   = useRef(null);
  const unsubscribeRef = useRef(null);
  const clientIdRef = useRef(null);

  // We need the clientId to register the native token when it's generated
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        clientIdRef.current = user.id || user._id;
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isNative) {
      // ── Native Listeners ────────────────────────────────────────────────────
      PushNotifications.addListener('registration', async ({ value: token }) => {
        console.log('[FCM] Native Token:', token);
        localStorage.setItem(FCM_TOKEN_KEY, token);
        if (clientIdRef.current) {
          await registerTokenWithBackend(clientIdRef.current, token);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('[FCM] Native Registration Error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[FCM] Native Push Received:', notification);
        if (onForegroundMessage) {
          onForegroundMessage({
            notification: {
              title: notification.title,
              body: notification.body,
            },
            data: notification.data
          });
        }
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[FCM] Native Push Action:', action);
      });

      return () => {
        PushNotifications.removeAllListeners();
      };
    } else {
      // ── Web Listeners ───────────────────────────────────────────────────────
      let cancelled = false;
      const setupWebFCM = async () => {
        const messaging = await getFirebaseMessaging();
        if (!messaging || cancelled) return;
        
        unsubscribeRef.current = onMessage(messaging, (payload) => {
          if (onForegroundMessage) onForegroundMessage(payload);
        });
      };
      
      setupWebFCM();

      return () => {
        cancelled = true;
        if (unsubscribeRef.current) unsubscribeRef.current();
      };
    }
  }, [onForegroundMessage]);
}
