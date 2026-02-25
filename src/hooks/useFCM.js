// All imports must be at the top of the file
import { useEffect, useRef, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const FCM_TOKEN_KEY = 'fcm_token';


// ─── Platform detection ──────────────────────────────────────────────────────
function detectPlatform() {
  if (
    typeof window !== 'undefined' &&
    (window.Capacitor?.isNativePlatform?.() || window?.Capacitor?.platform === 'android')
  ) {
    return 'android';
  }
  return 'web';
}

// ─── Backend helpers ──────────────────────────────────────────────────────────
async function registerTokenWithBackend(clientId, token) {
  const platform = detectPlatform();
  const deviceLabel = `${platform === 'android' ? 'Android App' : 'Web Browser'} – ${navigator.userAgent.slice(0, 60)}`;

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
// Call right after login API succeeds with the clientId from the response.
// Only registers a REAL FCM token. If getToken() fails for any reason
// (push service unreachable, permission denied, etc.) the function returns
// silently — it never falls back to a fake device UUID.
// ─────────────────────────────────────────────────────────────────────────────
export async function registerFCMOnLogin(clientId) {
  if (!clientId) return;

  console.log('[FCM] Starting registration for client:', clientId);
  try {
    // ── Clean up any stale fake tokens (web-xxxx) from old sessions ───────────
    // ── Clean up any stale fake tokens (web-xxxx or device-xxxx) from old sessions ──
    const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (storedToken && (storedToken.startsWith('web-') || storedToken.startsWith('device-'))) {
      localStorage.removeItem(FCM_TOKEN_KEY);
    }
    localStorage.removeItem('device_token'); // From Login.tsx fallback
    localStorage.removeItem('fcm_device_id'); // From another potential fallback

    // ── Check browser push support ────────────────────────────────────────────
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('[FCM] Push notifications not supported in this browser.');
      return;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn('[FCM] Firebase Messaging not supported.');
      return;
    }

    const permission = await Notification.requestPermission();
    console.log('[FCM] Notification permission state:', permission);
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted.');
      return;
    }

    // ── Register the Firebase SW with config injected as query params ─────────
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

    let token = null;
    try {
      console.log('[FCM] Environment check:', {
        isSecure: window.isSecureContext,
        hostname: window.location.hostname,
        protocol: window.location.protocol
      });

      if (window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
        console.error('[FCM] Push Service requires HTTPS or localhost. Current:', window.location.origin);
        return;
      }

      console.log('[FCM] Cleaning up potentially conflicting Service Workers...');
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        if (reg.active?.scriptURL.includes('firebase-messaging-sw')) {
          console.log('[FCM] Unregistering existing Firebase SW to force fresh start...');
          await reg.unregister();
        }
      }

      console.log('[FCM] Registering fresh Service Worker...');
      const swReg = await navigator.serviceWorker.register(swUrl);
      
      console.log('[FCM] Waiting for worker activation...');
      // Wait for it to become active
      await new Promise((resolve) => {
        if (swReg.active) return resolve();
        const worker = swReg.installing || swReg.waiting;
        if (!worker) return resolve();
        worker.addEventListener('statechange', function handler() {
          if (this.state === 'activated') {
            worker.removeEventListener('statechange', handler);
            resolve();
          }
        });
        setTimeout(resolve, 4000); // Don't wait more than 4s
      });
      
      console.log('[FCM] Service Worker is active. Requesting token...');
      console.log('[FCM] VAPID Key used:', vapidKey ? (vapidKey.slice(0, 15) + '...') : 'NULL');

      // getToken with a 15s timeout — it can hang if push service is unreachable
      console.log('[FCM] Requesting token with 15s timeout...');
      token = await Promise.race([
        getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase getToken timed out (15s)')), 15000)),
      ]);
    } catch (tokenErr) {
      console.error('[FCM] Failed to get token:', tokenErr);
      return;
    }

    if (!token) {
      console.warn('[FCM] No token returned from Firebase.');
      return;
    }

    console.log('[FCM] Success! Real token obtained:', token.slice(0, 30) + '...');

    // ── Register with backend ─────────────────────────────────────────────────
    const alreadyRegisteredToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (token === alreadyRegisteredToken) {
      console.log('[FCM] This token is already registered locally, skipping API call.');
      return;
    }

    console.log('[FCM] Registering token with backend...');
    const result = await registerTokenWithBackend(clientId, token);
    console.log('[FCM] Backend registration result:', result);
    
    localStorage.setItem(FCM_TOKEN_KEY, token);
    console.log('[FCM] Everything done! Dashboard will now receive notifications.');

  } catch (err) {
    console.error('[FCM] registerFCMOnLogin error:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// removeFCMTokenOnLogout
// ─────────────────────────────────────────────────────────────────────────────
export async function removeFCMTokenOnLogout() {
  const token = localStorage.getItem(FCM_TOKEN_KEY);
  if (!token) return;

  // Fake tokens (web-xxx) were never registered with the backend — just purge locally
  if (token.startsWith('web-')) {
    localStorage.removeItem(FCM_TOKEN_KEY);
    return;
  }

  try {
    await removeTokenFromBackend(token);
  } catch (err) {
    console.warn('[FCM] Could not remove token from backend:', err);
  } finally {
    localStorage.removeItem(FCM_TOKEN_KEY);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// useFCM hook — foreground message listener only
// ─────────────────────────────────────────────────────────────────────────────
export function useFCM({ onMessage: onForegroundMessage }) {
  const messagingRef   = useRef(null);
  const unsubscribeRef = useRef(null);

  const getMessagingInstance = useCallback(async () => {
    if (messagingRef.current) return messagingRef.current;
    const instance = await getFirebaseMessaging();
    messagingRef.current = instance;
    return instance;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const messaging = await getMessagingInstance();
      if (!messaging || cancelled) return;

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = onMessage(messaging, (payload) => {
        if (onForegroundMessage) {
          onForegroundMessage(payload);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [getMessagingInstance, onForegroundMessage]);
}
