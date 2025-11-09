import { useEffect, useCallback } from 'react';
import { getSocket, onSocketConnected, offSocketConnected, isSocketConnected } from '../utils/socketClient';

/**
 * Custom hook to safely use Socket.io events
 * Automatically handles connection lifecycle and cleanup
 * 
 * @param {string} eventName - The socket event name to listen for
 * @param {Function} handler - The event handler function
 * @param {Array} dependencies - Dependencies array for the effect
 */
export const useSocketEvent = (eventName, handler, dependencies = []) => {
  useEffect(() => {
    if (!eventName || !handler) return;

    // Set up listener when socket connects
    const setupListener = (socket) => {
      socket.on(eventName, handler);
    };

    // Subscribe to socket connection events
    onSocketConnected(setupListener);

    // Try to set up listener immediately if socket is already connected
    try {
      const socket = getSocket();
      if (socket.connected) {
        setupListener(socket);
      }
    } catch (err) {
      // Socket not initialized yet - will be set up via onSocketConnected callback
    }

    return () => {
      // Cleanup
      offSocketConnected(setupListener);
      try {
        const socket = getSocket();
        socket.off(eventName, handler);
      } catch (err) {
        // Socket might not exist during cleanup
      }
    };
  }, [eventName, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps
};

/**
 * Custom hook to emit Socket.io events safely
 * 
 * @returns {Function} emit function that can be called to emit events
 */
export const useSocketEmit = () => {
  return useCallback((eventName, ...args) => {
    try {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit(eventName, ...args);
        return true;
      } else {
        console.warn(`Cannot emit '${eventName}': socket not connected`);
        return false;
      }
    } catch (err) {
      console.error(`Error emitting '${eventName}':`, err);
      return false;
    }
  }, []);
};

/**
 * Custom hook to check socket connection status
 * 
 * @returns {boolean} true if socket is connected, false otherwise
 */
export const useSocketConnected = () => {
  return isSocketConnected();
};
