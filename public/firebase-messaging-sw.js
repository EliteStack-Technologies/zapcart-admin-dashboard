// Firebase Cloud Messaging Service Worker
// Handles background push notifications when the app is minimized or closed.
// This file MUST be in /public so it's served from the root (/).

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ─── Skip waiting so this SW activates immediately without blocking ───────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// ─── Firebase Config ──────────────────────────────────────────────────────────
// Config is injected at registration time via query-string params appended by
// useFCM.js → buildSwUrl(). self.location.search contains the full query string.
const urlParams = new URLSearchParams(self.location.search || '');

const firebaseConfig = {
  apiKey:            urlParams.get('apiKey')            || '',
  authDomain:        urlParams.get('authDomain')        || '',
  projectId:         urlParams.get('projectId')         || '',
  storageBucket:     urlParams.get('storageBucket')     || '',
  messagingSenderId: urlParams.get('messagingSenderId') || '',
  appId:             urlParams.get('appId')             || '',
};

// Guard: only initialise if Firebase hasn't already been initialised in this SW
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// ─── Background Message Handler ───────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationBody  = payload.notification?.body  || payload.data?.body  || '';
  const notificationType  = payload.data?.type || '';

  let icon = '/tick.svg';

  const notificationOptions = {
    body:  notificationBody,
    icon,
    badge: '/tick.svg',
    tag:   notificationType || 'zapcart-notification',
    data:  payload.data || {},
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ─── Notification Click Handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
