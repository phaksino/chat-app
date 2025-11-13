import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import MessageReactions from './MessageReactions';
import { useMessagePagination } from '../hooks/useMessagePagination';

const MessageList = ({ 
  socket,
  currentRoom,
  currentUser,
  typingUsers,
  messageReactions,
  messagesEndRef 
}) => {
  const { messages, isLoading, hasMore, loadMoreMessages } = useMessagePagination(socket, currentRoom, currentUser);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesContainerRef = useRef(null);
  const observerRef = useRef();

  // Virtual scroll optimization - only render visible messages
  const visibleMessages = useMemo(() => {
    // For now, render all messages. In a large app, implement windowing
    return messages;
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive and user is near bottom
  useEffect(() => {
    if (isNearBottom && messagesContainerRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isNearBottom, messagesEndRef]);

  // Track scroll position for infinite scroll and auto-scroll
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setScrollPosition(scrollTop);

    // Check if user is near bottom (within 100px)
    const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(nearBottom);

    // Load more messages when near top
    if (scrollTop < 100 && hasMore && !isLoading) {
      loadMoreMessages();
    }
  }, [hasMore, isLoading, loadMoreMessages]);

  // Intersection Observer for loading more messages
  const lastMessageRef = useCallback((node) => {
    if (isLoading) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMessages();
      }
    });

    if (node) {
      observerRef.current.observe(node);
    }
  }, [isLoading, hasMore, loadMoreMessages]);

  const renderFileMessage = (file, index) => {
    const isImage = file.fileType.startsWith('image/');
    
    return (
      <div 
        key={file.id} 
        className="flex items-start space-x-3 message-animation"
        ref={index === 0 ? lastMessageRef : null}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
          {file.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="font-semibold text-gray-800">{file.user}</span>
            {file.user === currentUser.username && (
              <span className="text-xs text-blue-500">You</span>
            )}
            <span className="text-xs text-gray-500">
              {new Date(file.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-md">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">
                {isImage ? '🖼️' : '📎'}
              </span>
              <div>
                <p className="font-medium text-gray-800">{file.fileName}</p>
                <p className="text-sm text-gray-500">{file.fileSize}</p>
              </div>
            </div>
            {isImage && (
              <img 
                src={file.fileUrl} 
                alt={file.fileName}
                className="max-w-full h-auto rounded-lg max-h-48 object-cover"
                loading="lazy" // Lazy load images
              />
            )}
            <div className="mt-2">
              <a 
                href={file.fileUrl} 
                download={file.fileName}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={messagesContainerRef}
      className="h-full overflow-y-auto bg-gray-50 p-4"
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Loading indicator for older messages */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading older messages...</p>
          </div>
        )}

        {/* Messages */}
        {visibleMessages.map((message, index) => (
          <div key={message.id} className="message-animation">
            {message.type === 'file' ? (
              renderFileMessage(message, index)
            ) : message.type === 'user' ? (
              <div 
                className="flex items-start space-x-3"
                ref={index === 0 ? lastMessageRef : null}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                  {message.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline space-x-2 mb-1">
                    <span className="font-semibold text-gray-800">{message.user}</span>
                    {message.user === currentUser.username && (
                      <span className="text-xs text-blue-500">You</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`inline-block px-4 py-2 rounded-2xl ${
                    message.user === currentUser.username
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    {message.message}
                  </div>
                  <MessageReactions 
                    messageId={message.id}
                    currentReactions={messageReactions[message.id]}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                  {message.message}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm italic">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}
        
        {/* Scroll anchor for new messages */}
        <div ref={messagesEndRef} />
        
        {/* No messages state */}
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No messages yet</h3>
            <p className="text-gray-600">Be the first to start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageList);