import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store data
const activeUsers = new Map();
const chatRooms = ['general', 'random', 'help', 'tech', 'gaming'];
const privateMessages = new Map();
const userNotifications = new Map(); // Store unread notifications

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('user_join', (userData) => {
    const user = {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar,
      joinedAt: new Date(),
      status: 'online'
    };
    
    activeUsers.set(socket.id, user);
    socket.join('general');
    
    // Initialize notifications for user
    userNotifications.set(user.username, []);
    
    // Notify all clients about new user
    socket.broadcast.emit('user_joined', {
      user: user.username,
      message: `${user.username} joined the chat`,
      timestamp: new Date(),
      onlineUsers: Array.from(activeUsers.values())
    });
    
    // Send welcome notification to new user
    socket.emit('new_notification', {
      id: Date.now(),
      type: 'welcome',
      title: 'Welcome to ChatApp!',
      message: 'You have successfully joined the chat. Start messaging now!',
      timestamp: new Date(),
      read: false
    });
    
    // Send current users and rooms to the new user
    socket.emit('connection_success', {
      message: 'Connected successfully',
      user: user,
      onlineUsers: Array.from(activeUsers.values()),
      rooms: chatRooms
    });
  });

  // Handle public messages with notifications
  socket.on('send_message', (messageData) => {
    const message = {
      ...messageData,
      id: Date.now() + Math.random(),
      serverTimestamp: new Date(),
      readBy: [messageData.user]
    };

    // Broadcast to all clients in the room
    io.to(messageData.room).emit('new_message', message);
    
    // Send notifications to users not in the room
    activeUsers.forEach((user, userId) => {
      const userRooms = Array.from(socket.rooms);
      if (!userRooms.includes(messageData.room) && userId !== socket.id) {
        io.to(userId).emit('new_notification', {
          id: Date.now(),
          type: 'room_activity',
          title: `New message in #${messageData.room}`,
          message: `${messageData.user}: ${messageData.message.substring(0, 50)}...`,
          timestamp: new Date(),
          room: messageData.room,
          read: false
        });
        
        // Update user's notification count
        const notifications = userNotifications.get(user.username) || [];
        userNotifications.set(user.username, [...notifications, {
          id: Date.now(),
          type: 'room_activity',
          title: `New message in #${messageData.room}`,
          timestamp: new Date(),
          read: false
        }]);
        
        // Update user's unread count
        io.to(userId).emit('unread_count_update', {
          count: userNotifications.get(user.username)?.filter(n => !n.read).length || 0
        });
      }
    });
  });

  // Handle private messages with notifications
  socket.on('send_private_message', (data) => {
    const privateMessage = {
      id: Date.now() + Math.random(),
      from: data.from,
      to: data.to,
      message: data.message,
      timestamp: new Date(),
      read: false
    };

    // Store private message
    const conversationId = [data.from, data.to].sort().join('_');
    if (!privateMessages.has(conversationId)) {
      privateMessages.set(conversationId, []);
    }
    privateMessages.get(conversationId).push(privateMessage);

    // Find recipient's socket
    const recipient = Array.from(activeUsers.entries()).find(
      ([_, user]) => user.username === data.to
    );

    if (recipient) {
      // Send to recipient
      io.to(recipient[0]).emit('new_private_message', privateMessage);
      
      // Send notification to recipient
      io.to(recipient[0]).emit('new_notification', {
        id: Date.now(),
        type: 'private_message',
        title: `New message from ${data.from}`,
        message: data.message.substring(0, 50),
        timestamp: new Date(),
        from: data.from,
        read: false
      });
      
      // Update recipient's notification count
      const notifications = userNotifications.get(data.to) || [];
      userNotifications.set(data.to, [...notifications, {
        id: Date.now(),
        type: 'private_message',
        title: `New message from ${data.from}`,
        timestamp: new Date(),
        read: false
      }]);
      
      io.to(recipient[0]).emit('unread_count_update', {
        count: userNotifications.get(data.to)?.filter(n => !n.read).length || 0
      });
      
      // Send confirmation to sender
      socket.emit('private_message_sent', {
        ...privateMessage,
        status: 'delivered'
      });
    } else {
      // Recipient offline - store notification for when they come back
      const notifications = userNotifications.get(data.to) || [];
      userNotifications.set(data.to, [...notifications, {
        id: Date.now(),
        type: 'private_message',
        title: `New message from ${data.from}`,
        message: data.message.substring(0, 50),
        timestamp: new Date(),
        from: data.from,
        read: false
      }]);
      
      socket.emit('private_message_sent', {
        ...privateMessage,
        status: 'pending'
      });
    }
  });

  // Handle read receipts and mark notifications as read
  socket.on('message_read', (data) => {
    const conversationId = [data.from, data.to].sort().join('_');
    const messages = privateMessages.get(conversationId);
    
    if (messages) {
      const message = messages.find(msg => msg.id === data.messageId);
      if (message) {
        message.read = true;
        message.readAt = new Date();
        
        // Mark related notification as read
        const notifications = userNotifications.get(data.to) || [];
        const updatedNotifications = notifications.map(notification => 
          notification.type === 'private_message' && notification.from === data.from
            ? { ...notification, read: true }
            : notification
        );
        userNotifications.set(data.to, updatedNotifications);
        
        // Update unread count
        io.to(socket.id).emit('unread_count_update', {
          count: updatedNotifications.filter(n => !n.read).length
        });
        
        // Notify sender that message was read
        const sender = Array.from(activeUsers.entries()).find(
          ([_, user]) => user.username === data.from
        );
        
        if (sender) {
          io.to(sender[0]).emit('message_read_receipt', {
            messageId: data.messageId,
            readBy: data.to,
            readAt: message.readAt
          });
        }
      }
    }
  });

  // Handle marking notifications as read
  socket.on('mark_notification_read', (data) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      const notifications = userNotifications.get(user.username) || [];
      const updatedNotifications = notifications.map(notification =>
        notification.id === data.notificationId
          ? { ...notification, read: true }
          : notification
      );
      userNotifications.set(user.username, updatedNotifications);
      
      // Send updated unread count
      socket.emit('unread_count_update', {
        count: updatedNotifications.filter(n => !n.read).length
      });
    }
  });

  // Handle marking all notifications as read
  socket.on('mark_all_notifications_read', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      const notifications = userNotifications.get(user.username) || [];
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      userNotifications.set(user.username, updatedNotifications);
      
      socket.emit('unread_count_update', { count: 0 });
      socket.emit('all_notifications_marked_read');
    }
  });

  // Handle user joining/leaving room notifications
  socket.on('join_room', (roomData) => {
    if (roomData.previousRoom) {
      socket.leave(roomData.previousRoom);
    }
    socket.join(roomData.newRoom);
    
    // Notify room members
    socket.broadcast.to(roomData.newRoom).emit('user_joined_room', {
      user: roomData.user,
      room: roomData.newRoom,
      timestamp: new Date()
    });
    
    // Send notification to user about room join
    socket.emit('new_notification', {
      id: Date.now(),
      type: 'room_join',
      title: `Joined #${roomData.newRoom}`,
      message: `You have joined the ${roomData.newRoom} room`,
      timestamp: new Date(),
      room: roomData.newRoom,
      read: false
    });
  });

  // Handle user status changes
  socket.on('user_status_change', (data) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      user.status = data.status;
      
      // Notify all users about status change
      socket.broadcast.emit('user_status_updated', {
        user: user.username,
        status: data.status,
        timestamp: new Date()
      });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.room).emit('user_typing', {
      user: data.user,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.room).emit('user_typing', {
      user: data.user,
      isTyping: false
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      user.status = 'offline';
      activeUsers.delete(socket.id);
      
      // Notify all clients about user leaving
      socket.broadcast.emit('user_left', {
        user: user.username,
        message: `${user.username} left the chat`,
        timestamp: new Date(),
        onlineUsers: Array.from(activeUsers.values())
      });
      
      // Notify about status change
      socket.broadcast.emit('user_status_updated', {
        user: user.username,
        status: 'offline',
        timestamp: new Date()
      });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    onlineUsers: activeUsers.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Advanced Chat server with notifications running on port ${PORT}`);
});