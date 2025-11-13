import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const MessageReactions = ({ messageId, currentReactions = {} }) => {
  const { socket, currentUser } = useSocket();
  const [showPicker, setShowPicker] = useState(false);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const handleReaction = (reaction) => {
    if (!socket || !currentUser) return;

    socket.emit('add_message_reaction', {
      messageId,
      reaction,
      user: currentUser.username
    });

    setShowPicker(false);
  };

  const reactionCounts = Object.values(currentReactions).reduce((acc, reaction) => {
    acc[reaction] = (acc[reaction] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="relative">
      {/* Reaction display */}
      <div className="flex items-center space-x-1 mt-1">
        {Object.entries(reactionCounts).map(([reaction, count]) => (
          <button
            key={reaction}
            className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-xs transition-colors"
            onClick={() => handleReaction(reaction)}
          >
            {reaction} {count}
          </button>
        ))}
        
        {/* Add reaction button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
        >
          +
        </button>
      </div>

      {/* Reaction picker */}
      {showPicker && (
        <div className="absolute bottom-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 flex space-x-1">
          {reactions.map((reaction) => (
            <button
              key={reaction}
              onClick={() => handleReaction(reaction)}
              className="hover:bg-gray-100 p-1 rounded transition-colors text-lg"
            >
              {reaction}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;