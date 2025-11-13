import React, { useState, useEffect } from 'react';

const ConnectionStatus = ({ isConnected, reconnectAttempts, lastDisconnect, onReconnect, maxAttempts }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [timeSinceDisconnect, setTimeSinceDisconnect] = useState('');

  useEffect(() => {
    if (lastDisconnect) {
      const updateTime = () => {
        const seconds = Math.floor((new Date() - lastDisconnect) / 1000);
        if (seconds < 60) {
          setTimeSinceDisconnect(`${seconds}s ago`);
        } else {
          setTimeSinceDisconnect(`${Math.floor(seconds / 60)}m ago`);
        }
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [lastDisconnect]);

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm">Connected</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
      >
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm">
          Disconnected {reconnectAttempts > 0 && `(${reconnectAttempts}/${maxAttempts})`}
        </span>
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-red-200 p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Connection Status</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Offline</span>
            </div>
            
            {lastDisconnect && (
              <div className="text-xs text-gray-600">
                Disconnected {timeSinceDisconnect}
              </div>
            )}
            
            {reconnectAttempts > 0 && (
              <div className="text-xs text-gray-600">
                Reconnect attempt {reconnectAttempts} of {maxAttempts}
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={onReconnect}
                className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Reconnect Now
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-gray-500">
              💡 Check your internet connection if problems persist
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;