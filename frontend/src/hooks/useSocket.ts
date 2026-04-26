import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api')
  .replace('/api', '');

let socketInstance: Socket | null = null;

export function useSocket(): Socket | null {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.firebaseUser?.uid) return;

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = socketInstance;
    socketInstance.emit('register', user.firebaseUser.uid);

    if (user.role === 'admin') {
      socketInstance.emit('join_company', 'default-company-001');
    }
  }, [user?.firebaseUser?.uid]);

  return socketRef.current;
}

export function useRealTimeNotifications(onNotification: (data: any) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on('application_status_update', onNotification);
    socket.on('application_updated', onNotification);
    return () => {
      socket.off('application_status_update', onNotification);
      socket.off('application_updated', onNotification);
    };
  }, [socket, onNotification]);
}

export function useReputationUpdates(onUpdate: (data: any) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on('reputation_updated', onUpdate);
    return () => {
      socket.off('reputation_updated', onUpdate);
    };
  }, [socket, onUpdate]);
}
