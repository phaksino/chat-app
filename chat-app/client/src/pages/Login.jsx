import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [isLoading, setIsLoading] = useState(false);
  const { socket, setCurrentUser } = useSocket();
  const navigate = useNavigate();

  const avatars = ['👤', '👨', '👩', '🐱', '🐶', '🦊', '🐼', '🐯'];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    setIsLoading(true);

    const userData = {
      username: username.trim(),
      avatar: avatar
    };

    // Emit user join event
    socket.emit('user_join', userData);

    // Set current user and navigate to chat
    setCurrentUser(userData);
    navigate('/chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💬 ChatApp</h1>
          <p className="text-gray-600">Join the conversation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Choose a Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your username..."
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose an Avatar
            </label>
            <div className="grid grid-cols-4 gap-3">
              {avatars.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`p-4 text-2xl rounded-lg border-2 transition-all ${
                    avatar === av 
                      ? 'border-blue-500 bg-blue-50 scale-105' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-semibold text-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </span>
            ) : (
              'Join Chat'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            💡 Tip: Choose a unique username to stand out in the chat!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;