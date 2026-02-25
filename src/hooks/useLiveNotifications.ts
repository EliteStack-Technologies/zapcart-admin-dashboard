import { useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface LiveNotificationProps {
  onMessage: (notification: { 
    title: string; 
    body: string; 
    data: any; 
    isQuiet?: boolean;
    timestamp?: string;
    id?: string;
  }) => void;
}

/**
 * useLiveNotifications
 * 
 * A complementary listener to FCM. While FCM handles background push,
 * this Firestore listener handles "Instant" UI notifications for the 
 * dashboard using standard HTTPS sockets (more reliable on restricted networks).
 */
export function useLiveNotifications({ onMessage, clientId }: LiveNotificationProps & { clientId?: string }) {
  const isInitialLoad = useRef(true);
  const processedIds = useRef(new Set<string>());

  useEffect(() => {
    if (!clientId) return;

    // Reset for new client
    isInitialLoad.current = true;
    processedIds.current.clear();

    const notificationsRef = collection(db, 'client_notifications', String(clientId), 'items');
    
    // Listen for new notifications
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          
          // Deduplicate
          if (processedIds.current.has(docId)) return;
          processedIds.current.add(docId);

          const data = change.doc.data();
          const createdAt = data.createdAt as Timestamp;
          if (!createdAt) return;

          const now = Date.now();
          const thirtySecondsAgo = now - 30000;
          const isFresh = createdAt.toMillis() > thirtySecondsAgo;

          onMessage({
            id: docId,
            title: data.title,
            body: data.body,
            data: data.data || {},
            timestamp: createdAt.toDate().toISOString(),
            // Only trigger sound/toast if it happened in the last 30 seconds
            isQuiet: !isFresh && !isInitialLoad.current 
          });
        }
      });
      isInitialLoad.current = false;
    }, (error) => {
      console.error('[LiveNotifications] Listener error:', error);
    });

    return () => unsubscribe();
  }, [clientId, onMessage]);
}
