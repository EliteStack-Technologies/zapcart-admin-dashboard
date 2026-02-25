import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to help bypass some local network blocks
export const db = getFirestore(app);
// Optional: Some environments need this if WebSockets are blocked
// import { initializeFirestore } from 'firebase/firestore';
// export const db = initializeFirestore(app, {
//   experimentalForceLongPolling: true,
// });

// Initialize Firebase Messaging (only if supported by the browser)
let messaging = null;

export const getFirebaseMessaging = async () => {
  if (messaging) return messaging;
  const supported = await isSupported();
  if (supported) {
    messaging = getMessaging(app);
    return messaging;
  }
  return null;
};

export default app;
