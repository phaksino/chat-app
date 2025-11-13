import React, { useState, useMemo, useRef, useEffect } from 'react';

const MessageSearch = ({ messages, onClose, onMessageSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const selectedRef = useRef(null);

  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return messages
      .filter(message => 
        message.type === 'user' && 
        message.message.toLowerCase().includes(term)
      )
      .slice(0, 10); // Limit results for performance
  }, [messages, searchTerm]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredMessages.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && filteredMessages.length > 0) {
      e.preventDefault();
      handleMessageSelect(filteredMessages[selectedIndex]);
    }
  };

  const handleMessageSelect = (message) => {
    onMessageSelect(message);
    onClose();
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Search Modal */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-96 bg-white rounded-lg shadow-xl border border-gray-200">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search messages..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              ⌘K
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No messages found' : 'Start typing to search messages'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredMessages.map((message, index) => (
                <div
                  key={message.id}
                  ref={index === selectedIndex ? selectedRef : null}
                  onClick={() => handleMessageSelect(message)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      {message.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {message.user}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {highlightSearchTerm(message.message, searchTerm)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{filteredMessages.length} results</span>
            <div className="flex items-center space-x-4">
              <span>↑↓ to navigate</span>
              <span>Enter to select</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to highlight search terms
const highlightSearchTerm = (text, term) => {
  if (!term.trim()) return text;
  
  const regex = new RegExp(`(${term})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export default MessageSearch;