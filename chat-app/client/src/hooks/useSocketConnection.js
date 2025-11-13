import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export const useSocketConnection = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastDisconnect, setLastDisconnect] = useState(null);
  const reconnectTimeoutRef = useRef();
  const optionsRef = useRef(options);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RECONNECT_DELAY = 1000;

  // Memoize the getReconnectDelay function
  const getReconnectDelay = useCallback((attempt) => {
    const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), 30000);
    return delay + Math.random() * 1000;
  }, []);

  // Memoize the connect function
  const connect = useCallback(() => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnection attempts reached');
      return null;
    }

    console.log('🔗 Attempting to connect to server...');
    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false,
      ...optionsRef.current
    });

    const handleConnect = () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
      setReconnectAttempts(0);
      setLastDisconnect(null);
    };

    const handleDisconnect = (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      setLastDisconnect(new Date());

      if (reason === 'io server disconnect') {
        console.log('Server disconnected the socket');
      } else {
        attemptReconnect();
      }
    };

    const handleConnectError = (error) => {
      console.log('🔌 Connection error:', error.message);
      setIsConnected(false);
      attemptReconnect();
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);

    setSocket(socketInstance);
    return socketInstance;
  }, [url, reconnectAttempts]);

  // Memoize the attemptReconnect function
  const attemptReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = getReconnectDelay(reconnectAttempts);
    console.log(`⏳ Attempting reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setReconnectAttempts(prev => prev + 1);
        connect();
      }
    }, delay);
  }, [reconnectAttempts, getReconnectDelay, connect]);

  // Memoize the disconnect function
  const disconnect = useCallback(() => {
    if (socket) {
      console.log('🔌 Disconnecting socket...');
      socket.disconnect();
      socket.removeAllListeners();
      setSocket(null);
      setIsConnected(false);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [socket]);

  // Memoize the reconnect function
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection requested');
    disconnect();
    setReconnectAttempts(0);
    connect();
  }, [disconnect, connect]);

  // Main useEffect - only run once on mount
  useEffect(() => {
    const socketInstance = connect();

    return () => {
      console.log('🧹 Cleaning up socket connection');
      disconnect();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return {
    socket,
    isConnected,
    reconnectAttempts,
    lastDisconnect,
    reconnect,
    disconnect,
    MAX_RECONNECT_ATTEMPTS
  };
};