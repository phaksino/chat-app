import { useState, useEffect, useCallback } from 'react';

export const useMessagePagination = (socket, currentRoom, currentUser) => {
  const [messages, setMessages] = useState([]);
  const [fileMessages, setFileMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const MESSAGES_PER_PAGE = 50;

  // Load initial messages
  useEffect(() => {
    if (!socket) return;

    const loadInitialMessages = async () => {
      setIsLoading(true);
      
      // Simulate API call
      const initialMessages = generateSampleMessages(20);
      setMessages(initialMessages);
      setHasMore(initialMessages.length === MESSAGES_PER_PAGE);
      setIsLoading(false);
    };

    loadInitialMessages();
  }, [socket, currentRoom]);

  // Load more messages (infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    setTimeout(() => {
      const newMessages = generateSampleMessages(MESSAGES_PER_PAGE, messages.length);
      
      if (newMessages.length < MESSAGES_PER_PAGE) {
        setHasMore(false);
      }
      
      setMessages(prev => [...newMessages, ...prev]);
      setPage(prev => prev + 1);
      setIsLoading(false);
    }, 500);
  }, [isLoading, hasMore, messages.length]);

  // Handle real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleNewFileMessage = (fileMessage) => {
      setFileMessages(prev => [...prev, fileMessage]);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_file_message', handleNewFileMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_file_message', handleNewFileMessage);
    };
  }, [socket]);

  // Reset pagination when room changes
  useEffect(() => {
    setMessages([]);
    setFileMessages([]);
    setPage(1);
    setHasMore(true);
  }, [currentRoom]);

  const allMessages = [...messages, ...fileMessages].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  return {
    messages: allMessages,
    isLoading,
    hasMore,
    loadMoreMessages,
    page
  };
};

// Helper function to generate sample messages
const generateSampleMessages = (count, offset = 0) => {
  const sampleMessages = [
    "Hello everyone! 👋",
    "How's it going?",
    "This chat is awesome!",
    "Anyone working on something interesting?",
    "Just joined the room!",
    "Great discussion happening here!",
    "Does anyone have experience with Socket.io?",
    "I love real-time applications!",
    "The weather is beautiful today 🌞",
    "Working on a new project, excited to share soon!"
  ];

  const users = [
    { username: 'alice', avatar: '👩' },
    { username: 'bob', avatar: '👨' },
    { username: 'charlie', avatar: '😊' },
    { username: 'diana', avatar: '🌟' }
  ];

  return Array.from({ length: count }, (_, index) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const messageIndex = Math.floor(Math.random() * sampleMessages.length);
    
    return {
      id: offset + index + 1,
      type: 'user',
      user: user.username,
      avatar: user.avatar,
      message: sampleMessages[messageIndex],
      timestamp: new Date(Date.now() - (offset + index) * 60000),
      room: 'general'
    };
  });
};