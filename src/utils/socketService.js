import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.authToken = null;
    this.heartbeatInterval = null;
  }

  connect(token) {
    // Update auth token if provided
    if (token) {
      this.authToken = token;
    }

    // If socket already exists
    if (this.socket) {
      // If we now have a token and not connected, attach and connect
      if (this.authToken) {
        try {
          this.socket.auth = { token: this.authToken };
        } catch {}
        if (!this.isConnected && this.socket.disconnected) {
          this.socket.connect();
        }
      }
      return this.socket;
    }

    // Create socket instance. Avoid connecting without token to prevent server-side "Token required" errors
try {
    const base = (import.meta?.env?.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const hasToken = Boolean(this.authToken);
      this.socket = io(base, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: this.maxReconnectAttempts,
        autoConnect: hasToken, // only auto-connect when we have a token
        auth: hasToken ? { token: this.authToken } : undefined
      });

      this.setupEventHandlers();

      // Ensure auth data is sent on every reconnect attempt as well
      this.socket.io.on('reconnect_attempt', () => {
        if (this.socket && this.authToken) {
          try {
            this.socket.auth = { token: this.authToken };
          } catch {}
        }
      });

      return this.socket;
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      return null;
    }
  }

  // ฟังก์ชันสำหรับ authenticate socket
  authenticate(token) {
    if (!this.socket) {
      console.error('Socket not available for authentication');
      return Promise.reject(new Error('Socket not available'));
    }

    this.authToken = token;

    return new Promise((resolve, reject) => {
      // ตั้ง timeout สำหรับ authentication
      const authTimeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 10000);

      // ส่ง authentication event
      this.socket.emit('authenticate', { token });

      // รับผลลัพธ์ authentication
      const authSuccessHandler = (data) => {
        clearTimeout(authTimeout);
        this.isAuthenticated = true;
        this.socket.off('auth_success', authSuccessHandler);
        this.socket.off('auth_error', authErrorHandler);
        this.startHeartbeat();
        resolve(data);
      };

      const authErrorHandler = (error) => {
        clearTimeout(authTimeout);
        this.isAuthenticated = false;
        this.socket.off('auth_success', authSuccessHandler);
        this.socket.off('auth_error', authErrorHandler);
        reject(new Error(error.message || 'Authentication failed'));
      };

      this.socket.on('auth_success', authSuccessHandler);
      this.socket.on('auth_error', authErrorHandler);
    });
  }

  // เริ่ม heartbeat
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected && this.isAuthenticated) {
        this.socket.emit('ping');
      }
    }, 30000); // ส่ง ping ทุก 30 วินาที
  }

  // หยุด heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // ถ้ามี token ให้ authenticate อัตโนมัติ
      if (this.authToken) {
        try {
          this.socket.auth = { token: this.authToken };
        } catch {}
        this.authenticate(this.authToken).catch(error => {
          console.error('Auto-authentication failed:', error);
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.stopHeartbeat();

      if (reason === 'io server disconnect') {
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      // Suppress noisy errors when no token has been provided yet
      if (!this.authToken && (error?.message === 'Token required' || /token/i.test(error?.message || ''))) {
        return;
      }
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;

      // ถ้ามี token ให้ authenticate อัตโนมัติ
      if (this.authToken) {
        try {
          this.socket.auth = { token: this.authToken };
        } catch {}
        this.authenticate(this.authToken).catch(error => {
          console.error('Reconnection authentication failed:', error);
        });
      }
    });

    // รับ pong response
    this.socket.on('pong', (data) => {
      console.log('💓 Heartbeat response received:', data.timestamp);
    });
  }

  getSocket() {
    if (!this.socket) {
      return this.connect(this.authToken);
    }
    return this.socket;
  }

  on(event, callback) {
    const socket = this.getSocket();
    if (!socket) {
      console.error('Socket not available');
      return;
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    socket.on(event, callback);
  }

  off(event, callback) {
    const socket = this.getSocket();
    if (!socket) return;

    if (callback) {
      socket.off(event, callback);
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    } else {
      socket.off(event);
      this.eventListeners.delete(event);
    }
  }

  emit(event, data) {
    const socket = this.getSocket();
    if (!socket) {
      console.error('Socket not available for emit');
      return;
    }

    // ตรวจสอบว่า authenticated แล้วหรือไม่ (ยกเว้น authenticate event)
    if (event !== 'authenticate' && !this.isAuthenticated) {
      console.warn('Socket not authenticated, cannot emit:', event);
      return;
    }

    socket.emit(event, data);
  }

  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  isSocketAuthenticated() {
    return this.socket && this.isConnected && this.isAuthenticated;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');

      this.stopHeartbeat();
      this.isAuthenticated = false;
      this.authToken = null;

      this.eventListeners.forEach((listeners, event) => {
        listeners.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.eventListeners.clear();

      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;

      console.log('✅ Socket disconnected');
    }
  }

  cleanup() {
    this.stopHeartbeat();
    this.eventListeners.clear();
  }
}

const socketService = new SocketService();

export default socketService;