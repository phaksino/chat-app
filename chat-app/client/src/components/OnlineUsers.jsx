import React from 'react';

const OnlineUsers = ({ onlineUsers, currentUser, onStartPrivateChat }) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <h3 className="font-semibold text-gray-700 mb-4">Online Users ({onlineUsers.length})</h3>
      <div className="space-y-2">
        {onlineUsers.map((user) => (
          <div
            key={user.id}
            className={`flex items-center space-x-3 p-2 rounded-lg ${
              user.username === currentUser.username ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user.username}
                {user.username === currentUser.username && (
                  <span className="ml-1 text-blue-500">(You)</span>
                )}
              </p>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
            {user.username !== currentUser.username && (
              <button
                onClick={() => onStartPrivateChat(user.username)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                title="Start private chat"
              >
                💬
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUsers;