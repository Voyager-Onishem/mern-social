import { io } from 'socket.io-client';

let socket = null;
let connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected'
const eventEmitter = {
  listeners: {},
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },
  emit(event, ...args) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(...args));
  }
};

export const initializeSocket = (token) => {
  // If socket already exists and is connected, return it
  if (socket) {
    // Update token if changed
    if (socket.auth.token !== token) {
      socket.auth.token = token;
      if (socket.connected) {
        socket.disconnect();
        socket.connect();
      }
    }
    return socket;
  }

  const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:6001';
  
  socket = io(serverUrl, {
    auth: {
      token: token
    },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    connectionStatus = 'connected';
    eventEmitter.emit('socket:connected', socket);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    connectionStatus = 'disconnected';
    eventEmitter.emit('socket:error', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    connectionStatus = 'disconnected';
    eventEmitter.emit('socket:disconnected', reason);
    
    if (reason === 'io server disconnect') {
      // Server forcefully disconnected, manually reconnect
      socket.connect();
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
    connectionStatus = 'connected';
    eventEmitter.emit('socket:reconnected', attemptNumber);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('Socket reconnection attempt:', attemptNumber);
    connectionStatus = 'connecting';
  });

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('Socket reconnection failed after all attempts');
    connectionStatus = 'disconnected';
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};

export const getConnectionStatus = () => {
  return connectionStatus;
};

// Subscribe to socket connection events
export const onSocketConnected = (callback) => {
  eventEmitter.on('socket:connected', callback);
  // If already connected, call immediately
  if (isSocketConnected()) {
    callback(socket);
  }
};

export const offSocketConnected = (callback) => {
  eventEmitter.off('socket:connected', callback);
};

export const onSocketDisconnected = (callback) => {
  eventEmitter.on('socket:disconnected', callback);
};

export const offSocketDisconnected = (callback) => {
  eventEmitter.off('socket:disconnected', callback);
};

export const connectSocket = () => {
  if (socket && !socket.connected) {
    connectionStatus = 'connecting';
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    connectionStatus = 'disconnected';
  }
};
