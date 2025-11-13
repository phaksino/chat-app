import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocketConnection } from '../hooks/useSocketConnection';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const {
    socket,
    isConnected,
    reconnectAttempts,
    lastDisconnect,
    reconnect,
    MAX_RECONNECT_ATTEMPTS
  } = useSocketConnection(import.meta.env.VITE_API_URL || 'http://localhost:5000');

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState(new Map());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Memoize the updateOnlineUsers function
  const updateOnlineUsers = useCallback((users) => {
    setOnlineUsers(users);
  }, []);

  // Memoize the addNotification function
  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev].slice(0, 100);
      return newNotifications;
    });
  }, []);

  // Socket event handlers - memoized
  const handleUserJoined = useCallback((data) => {
    updateOnlineUsers(data.onlineUsers);
  }, [updateOnlineUsers]);

  const handleUserLeft = useCallback((data) => {
    updateOnlineUsers(data.onlineUsers);
  }, [updateOnlineUsers]);

  const handleConnectionSuccess = useCallback((data) => {
    setCurrentUser(data.user);
    updateOnlineUsers(data.onlineUsers);
  }, [updateOnlineUsers]);

  const handleNewNotification = useCallback((notification) => {
    addNotification(notification);
  }, [addNotification]);

  const handleUnreadCountUpdate = useCallback((data) => {
    setTotalUnreadCount(data.count);
    document.title = data.count > 0 ? `(${data.count}) ChatApp` : 'ChatApp';
  }, []);

  const handleNewPrivateMessage = useCallback((message) => {
    setPrivateMessages(prev => {
      const newMap = new Map(prev);
      const conversationId = [message.from, message.to].sort().join('_');
      const existing = newMap.get(conversationId) || [];
      const updatedConversation = [...existing, message].slice(-100);
      newMap.set(conversationId, updatedConversation);
      return newMap;
    });

    if (message.to === currentUser?.username) {
      setUnreadCounts(prev => ({
        ...prev,
        [message.from]: (prev[message.from] || 0) + 1
      }));
    }
  }, [currentUser]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    console.log('🎯 Setting up socket event listeners');

    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('connection_success', handleConnectionSuccess);
    socket.on('new_notification', handleNewNotification);
    socket.on('unread_count_update', handleUnreadCountUpdate);
    socket.on('new_private_message', handleNewPrivateMessage);

    return () => {
      console.log('🧹 Cleaning up socket event listeners');
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('connection_success', handleConnectionSuccess);
      socket.off('new_notification', handleNewNotification);
      socket.off('unread_count_update', handleUnreadCountUpdate);
      socket.off('new_private_message', handleNewPrivateMessage);
    };
  }, [
    socket, 
    handleUserJoined, 
    handleUserLeft, 
    handleConnectionSuccess, 
    handleNewNotification, 
    handleUnreadCountUpdate, 
    handleNewPrivateMessage
  ]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    currentUser,
    setCurrentUser,
    privateMessages,
    unreadCounts,
    notifications,
    totalUnreadCount,
    reconnectAttempts,
    lastDisconnect,
    reconnect,
    MAX_RECONNECT_ATTEMPTS
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};