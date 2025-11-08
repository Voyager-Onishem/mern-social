import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:6001';
  
  socket = io(serverUrl, {
    auth: {
      token: token
    },
    autoConnect: false
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const connectSocket = () => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
