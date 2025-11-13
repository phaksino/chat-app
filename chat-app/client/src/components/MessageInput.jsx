import React, { useState, useRef } from 'react';
import FileUpload from './FileUpload';

const MessageInput = ({ onSendMessage, onTypingStart, onTypingStop, disabled, room }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      handleStopTyping();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    
    if (!isTyping && e.target.value) {
      setIsTyping(true);
      onTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        handleStopTyping();
      }
    }, 1000);
  };

  const handleStopTyping = () => {
    setIsTyping(false);
    onTypingStop();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-3 items-end">
      <FileUpload room={room} onFileSent={() => {}} />
      
      <div className="flex-1">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Connecting..." : "Type a message..."}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          maxLength={500}
        />
      </div>
      
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
      >
        Send
      </button>
    </form>
  );
};

export default MessageInput;