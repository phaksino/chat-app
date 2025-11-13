import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const PrivateChat = ({ recipient, onClose }) => {
  const { socket, currentUser, privateMessages, markMessageAsRead } = useSocket();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const messagesEndRef = useRef(null);

  const conversationId = [currentUser.username, recipient].sort().join('_');

  useEffect(() => {
    // Load conversation when recipient changes
    const messages = privateMessages.get(conversationId) || [];
    setConversation(messages);

    // Mark messages as read
    messages.forEach(msg => {
      if (msg.to === currentUser.username && !msg.read) {
        markMessageAsRead(msg.id, msg.from, msg.to);
      }
    });
  }, [privateMessages, conversationId, currentUser, markMessageAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;

    socket.emit('send_private_message', {
      from: currentUser.username,
      to: recipient,
      message: message.trim()
    });

    setMessage('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col max-h-96">
      {/* Header */}
      <div className="bg-blue-500 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white text-blue-500 rounded-full flex items-center justify-center text-xs">
            👤
          </div>
          <span className="font-semibold">{recipient}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-lg"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {conversation.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === currentUser.username ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                msg.from === currentUser.username
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <div className={`text-xs mt-1 ${
                msg.from === currentUser.username ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
                {msg.read && msg.from === currentUser.username && (
                  <span className="ml-1">✓ Read</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a private message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrivateChat;