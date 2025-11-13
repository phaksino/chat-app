import React from 'react';

const RoomSelector = ({ currentRoom, onRoomChange }) => {
  const rooms = ['general', 'random', 'help', 'tech', 'gaming'];

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="font-semibold text-gray-700 mb-3">Chat Rooms</h3>
      <div className="space-y-1">
        {rooms.map(room => (
          <button
            key={room}
            onClick={() => onRoomChange(room)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              room === currentRoom
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            # {room}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomSelector;