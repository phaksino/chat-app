import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { notifications, totalUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useSocket();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.read;
    return notification.type === activeFilter;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'private_message':
        return '💬';
      case 'room_activity':
        return '🏠';
      case 'room_join':
        return '🚪';
      case 'user_joined':
        return '👋';
      case 'welcome':
        return '🎉';
      case 'mention':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'private_message':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'room_activity':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'mention':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationTime.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {totalUnreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {totalUnreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto">
            {['all', 'unread', 'private_message', 'room_activity'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'all' && 'All'}
                {filter === 'unread' && 'Unread'}
                {filter === 'private_message' && 'Messages'}
                {filter === 'room_activity' && 'Rooms'}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-lg">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    notification.read
                      ? 'bg-white border-gray-200 hover:bg-gray-50'
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}
                  onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      getNotificationColor(notification.type)
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className={`text-sm font-medium ${
                          notification.read ? 'text-gray-800' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      {notification.message && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      {!notification.read && (
                        <div className="flex items-center mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-blue-500 ml-1">New</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            {notifications.length} total notifications
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;