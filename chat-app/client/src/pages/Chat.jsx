import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import OnlineUsers from '../components/OnlineUsers';
import ChatHeader from '../components/ChatHeader';
import PrivateChat from '../components/PrivateChat';
import RoomSelector from '../components/RoomSelector';
import NotificationsPanel from '../components/NotificationsPanel';
import NotificationBell from '../components/NotificationBell';
import SoundSettings from '../components/SoundSettings';
import ConnectionStatus from '../components/ConnectionStatus';
import MessageSearch from '../components/MessageSearch';

const Chat = () => {
  const { 
    socket, 
    currentUser, 
    onlineUsers, 
    isConnected,
    reconnectAttempts,
    lastDisconnect,
    reconnect,
    MAX_RECONNECT_ATTEMPTS
  } = useSocket();
  
  const [currentRoom, setCurrentRoom] = useState('general');
  const [typingUsers, setTypingUsers] = useState([]);
  const [activePrivateChats, setActivePrivateChats] = useState([]);
  const [messageReactions, setMessageReactions] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [allMessages, setAllMessages] = useState([]); // For search functionality
  const messagesEndRef = useRef(null);

  // Handle room changes
  const handleRoomChange = useCallback((newRoom) => {
    if (newRoom !== currentRoom) {
      socket?.emit('join_room', {
        user: currentUser.username,
        previousRoom: currentRoom,
        newRoom: newRoom
      });
      setCurrentRoom(newRoom);
    }
  }, [socket, currentUser, currentRoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Collect all messages for search (throttled in real app)
  useEffect(() => {
    // In real app, you'd collect messages from your state management
    // This is simplified for demonstration
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ChatHeader 
          currentUser={currentUser} 
          isConnected={isConnected} 
        />
        <RoomSelector 
          currentRoom={currentRoom}
          onRoomChange={handleRoomChange}
        />
        <OnlineUsers 
          onlineUsers={onlineUsers} 
          currentUser={currentUser}
          onStartPrivateChat={setActivePrivateChats}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Room Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">#{currentRoom}</h2>
              <p className="text-sm text-gray-600">
                {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} online
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Search messages (Ctrl+K)"
              >
                🔍
              </button>

              {/* Notification and Sound Controls */}
              <div className="flex items-center space-x-2">
                <SoundSettings />
                <NotificationBell />
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="All Notifications"
                >
                  📋
                </button>
              </div>
              
              {/* Connection Status */}
              <ConnectionStatus
                isConnected={isConnected}
                reconnectAttempts={reconnectAttempts}
                lastDisconnect={lastDisconnect}
                onReconnect={reconnect}
                maxAttempts={MAX_RECONNECT_ATTEMPTS}
              />
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <MessageList 
            socket={socket}
            currentRoom={currentRoom}
            currentUser={currentUser}
            typingUsers={typingUsers}
            messageReactions={messageReactions}
            messagesEndRef={messagesEndRef}
          />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <MessageInput 
            currentRoom={currentRoom}
            disabled={!isConnected}
          />
        </div>
      </div>

      {/* Private Chat Windows */}
      {activePrivateChats.map(username => (
        <PrivateChat
          key={username}
          recipient={username}
          onClose={() => setActivePrivateChats(prev => prev.filter(user => user !== username))}
        />
      ))}

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Message Search */}
      {showSearch && (
        <MessageSearch
          messages={allMessages}
          onClose={() => setShowSearch(false)}
          onMessageSelect={(message) => {
            // Scroll to message implementation
            console.log('Selected message:', message);
          }}
        />
      )}
    </div>
  );
};

export default React.memo(Chat);