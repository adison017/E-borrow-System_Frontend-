import { useEffect, useRef, useCallback } from 'react';
import socketService from '../utils/socketService';

export const useSocket = () => {
  const eventListenersRef = useRef(new Map());

  // Connect on mount with token and keep it across reconnects
  useEffect(() => {
    const token = localStorage.getItem('token');
    socketService.connect(token);

    // Re-authenticate socket whenever token changes in localStorage
    const onStorage = (e) => {
      if (e.key === 'token') {
        const nextToken = e.newValue;
        if (nextToken) {
          socketService.connect(nextToken);
        } else {
          // Token removed -> disconnect socket to avoid unauthorized pings
          socketService.disconnect();
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      // do not disconnect globally; listeners are cleaned up per component
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // เพิ่ม event listener
  const on = useCallback((event, callback) => {
    socketService.on(event, callback);

    // เก็บ reference สำหรับ cleanup
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event).add(callback);
  }, []);

  // ลบ event listener
  const off = useCallback((event, callback) => {
    socketService.off(event, callback);

    const listeners = eventListenersRef.current.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        eventListenersRef.current.delete(event);
      }
    }
  }, []);

  // ส่ง event
  const emit = useCallback((event, data) => {
    socketService.emit(event, data);
  }, []);

  // ตรวจสอบสถานะการเชื่อมต่อ
  const isConnected = useCallback(() => {
    return socketService.isSocketConnected();
  }, []);

  // ตรวจสอบสถานะการ authenticate
  const isAuthenticated = useCallback(() => {
    return socketService.isSocketAuthenticated();
  }, []);

  // ฟังก์ชันสำหรับ authenticate socket
  const authenticate = useCallback(async (token) => {
    try {
      await socketService.authenticate(token);
      return true;
    } catch (error) {
      console.error('Socket authentication failed:', error);
      return false;
    }
  }, []);

  // Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => {
      // ลบ event listeners ทั้งหมดที่ component นี้เพิ่ม
      eventListenersRef.current.forEach((listeners, event) => {
        listeners.forEach(callback => {
          socketService.off(event, callback);
        });
      });
      eventListenersRef.current.clear();
    };
  }, []);

  return {
    on,
    off,
    emit,
    isConnected,
    isAuthenticated,
    authenticate,
    socket: socketService.getSocket()
  };
};

// Hook สำหรับ badge counts
export const useBadgeCounts = () => {
  const { on, off } = useSocket();

  const subscribeToBadgeCounts = useCallback((callback) => {
    on('badgeCountsUpdated', callback);

    return () => {
      off('badgeCountsUpdated', callback);
    };
  }, [on, off]);

  return { subscribeToBadgeCounts };
};