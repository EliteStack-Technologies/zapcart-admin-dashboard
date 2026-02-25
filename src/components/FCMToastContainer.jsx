import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const AUTO_CLOSE_MS = 5000;

/**
 * Map FCM notification type to an emoji icon and accent colour class.
 */
function getNotificationStyle(type) {
  switch (type) {
    case 'NEW_ORDER':
      return { icon: '🛒', accent: '#16a34a', label: 'New Order' };
    case 'NEW_ENQUIRY':
      return { icon: '📋', accent: '#2563eb', label: 'New Enquiry' };
    case 'LOW_STOCK':
      return { icon: '⚠️', accent: '#d97706', label: 'Low Stock' };
    default:
      return { icon: '🔔', accent: '#7c3aed', label: 'Notification' };
  }
}

/**
 * Single toast card component.
 */
function FCMToastCard({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);

  // Slide-in on mount
  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(showTimer);
  }, []);

  // Auto-close countdown
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    // Wait for slide-out animation before removing from DOM
    setTimeout(() => onDismiss(toast.id), 350);
  }, [toast.id, onDismiss]);

  const style = getNotificationStyle(toast.type);

  return (
    <div
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        maxWidth: '360px',
        width: '100%',
        background: 'rgba(15, 15, 20, 0.97)',
        backdropFilter: 'blur(16px)',
        borderRadius: '14px',
        border: `1px solid ${style.accent}33`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${style.accent}22, inset 0 1px 0 rgba(255,255,255,0.05)`,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '12px',
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Accent left bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: `linear-gradient(180deg, ${style.accent}, ${style.accent}88)`,
          borderRadius: '14px 0 0 14px',
        }}
      />

      {/* Content */}
      <div style={{ padding: '14px 14px 10px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Icon */}
        <div
          style={{
            fontSize: '24px',
            lineHeight: '1',
            flexShrink: 0,
            marginTop: '2px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          }}
        >
          {style.icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '2px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: style.accent,
              }}
            >
              {style.label}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: '14px',
              color: '#f1f5f9',
              lineHeight: '1.3',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {toast.title}
          </p>
          {toast.body && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '12px',
                color: '#94a3b8',
                lineHeight: '1.5',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {toast.body}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            padding: '2px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          aria-label="Dismiss notification"
          onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '3px',
          background: '#1e293b',
          margin: '0 18px',
          marginBottom: '8px',
          borderRadius: '99px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${style.accent}, ${style.accent}cc)`,
            borderRadius: '99px',
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    </div>
  );
}

/**
 * FCMToastContainer – renders all active FCM foreground toasts.
 *
 * Usage:
 *   const { addFCMToast } = useFCMToasts();
 *   ...
 *   <FCMToastContainer toasts={toasts} onDismiss={dismiss} />
 */
export function FCMToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <FCMToastCard toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
