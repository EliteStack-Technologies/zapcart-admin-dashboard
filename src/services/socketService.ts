import { io, Socket } from 'socket.io-client';
import { NotificationData } from '@/types/notifications';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners = new Map<string, (data: NotificationData) => void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastConnectAttempt = 0;
  private minReconnectDelay = 5000; // 5 seconds minimum between attempts
  private connectionStatusCallback: (() => void) | null = null;
  private currentClientId: string | null = null; // Store client ID for re-authentication

  // Initialize connection only once
  connect(): Socket | null {
    const now = Date.now();
    
    // Prevent rapid reconnection attempts
    if (this.lastConnectAttempt && (now - this.lastConnectAttempt) < this.minReconnectDelay) {
      const waitTime = this.minReconnectDelay - (now - this.lastConnectAttempt);
      
      setTimeout(() => {
        this.connect();
      }, waitTime);
      return null;
    }

    this.lastConnectAttempt = now;

    if (this.socket?.connected) {
      return this.socket;
    }

    // Disconnect any existing socket first
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = io('http://localhost:8000', {
      autoConnect: false,
      reconnection: false, // Disable auto-reconnection, we'll handle it manually
      timeout: 30000,
      forceNew: true,
      upgrade: true,
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
    this.socket.connect();
    
    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Auto re-authenticate if we have a stored client ID
      if (this.currentClientId) {
        setTimeout(() => {
          if (this.currentClientId) {
            this.authenticate(this.currentClientId);
          }
        }, 1000);
      }
      
      // Notify UI of connection status change
      if (this.connectionStatusCallback) {
        this.connectionStatusCallback();
      }
    });

    this.socket.on('welcome', (data) => {
      // Welcome message received
    });

    // this.socket.on('authenticated', (data) => {
    //   console.log('Successfully authenticated to room:', data.room);
    // });

    this.socket.on('disconnect_reason', (reason) => {
      // If it's a rate limit, wait longer before reconnecting
      if (reason.includes('Rate limit')) {
        this.minReconnectDelay = 10000; // 10 seconds
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.stopHeartbeat();
      
      // Notify UI of connection status change
      if (this.connectionStatusCallback) {
        this.connectionStatusCallback();
      }
      
      // Handle reconnection with delay
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(this.minReconnectDelay * (this.reconnectAttempts + 1), 30000);
        
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, delay);
      }
    });

    this.socket.on('connect_error', (error) => {
      // Don't attempt reconnection on connect_error, let disconnect handler handle it
      if (!this.isConnected) {
        this.reconnectAttempts++;
      }
    });

    this.socket.on('joined', (room) => {
      // Successfully joined room
    });

    this.socket.on('notification', (data: NotificationData) => {
      this.handleNotification(data);
    });

    this.socket.on('ping', () => {
      // Respond to server heartbeat
      this.socket?.emit('pong');
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 25000); // Slightly less than server heartbeat
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Handle incoming notifications
  private handleNotification(data: NotificationData): void {
    // Trigger all registered listeners
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  // Register notification listener
  onNotification(id: string, callback: (data: NotificationData) => void): void {
    this.listeners.set(id, callback);
  }

  // Remove notification listener
  offNotification(id: string): void {
    this.listeners.delete(id);
  }

  // Disconnect (only when app closes)
  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Manual reconnect (resets attempt counter)
  reconnect(): void {
    this.reconnectAttempts = 0;
    this.minReconnectDelay = 5000; // Reset delay
    this.disconnect();
    
    // Small delay before reconnecting
    setTimeout(() => {
      this.connect();
    }, 2000);
  }

  // Send test notification
  sendTestNotification(): void {
    if (this.socket?.connected) {
      this.socket.emit('test-notification');
    }
  }

  // Register connection status callback
  onConnectionStatusChange(callback: () => void): void {
    this.connectionStatusCallback = callback;
  }

  // Remove connection status callback
  offConnectionStatusChange(): void {
    this.connectionStatusCallback = null;
  }

  // Authenticate with client ID
  authenticate(clientId: string): void {
    // Store client ID for re-authentication on reconnection
    this.currentClientId = clientId;
    
    if (this.socket?.connected && clientId) {
      this.socket.emit('authenticate', { clientId });
    }
  }

  // Check if socket is actually connected
  isSocketConnected(): boolean {
    return this.socket?.connected === true && this.isConnected;
  }

  // Get connection info
  getConnectionInfo(): object {
    return {
      connected: this.isSocketConnected(),
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      lastConnectAttempt: this.lastConnectAttempt,
      minDelay: this.minReconnectDelay,
      listeners: this.listeners.size
    };
  }
}

// Export single instance
export default new SocketService();