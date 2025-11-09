# Issue 2 Fix: Socket.io Connection Management

## Problem
Socket.io was initialized in `App.js`, but `NotificationProvider` and other components tried to use it before it was fully connected, leading to:
- Race conditions when components mount before socket connects
- Error messages: "Socket not yet initialized for notifications"
- Components having to check `socket.connected` and handle connection timing manually
- Fragile code with try-catch blocks to handle initialization order

## Solution
Implemented a **connection-aware event system** that allows components to safely attach listeners without worrying about initialization order.

## Changes Made

### 1. Enhanced Socket Client (`client/src/utils/socketClient.js`)

#### Added Connection State Management:
```javascript
let connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected'
```

#### Added Event Emitter for Connection Events:
- `socket:connected` - Fired when socket connects/reconnects
- `socket:disconnected` - Fired when socket disconnects
- `socket:error` - Fired on connection errors
- `socket:reconnected` - Fired on successful reconnection

#### New API Functions:
- `isSocketConnected()` - Check if socket is currently connected
- `getConnectionStatus()` - Get current connection status
- `onSocketConnected(callback)` - Subscribe to connection events (calls callback immediately if already connected)
- `offSocketConnected(callback)` - Unsubscribe from connection events
- `onSocketDisconnected(callback)` - Subscribe to disconnection events
- `offSocketDisconnected(callback)` - Unsubscribe from disconnection events

#### Enhanced `initializeSocket()`:
- Now checks if token changed and reconnects if needed
- Properly tracks connection status
- Emits events on connection state changes

### 2. Created Custom React Hook (`client/src/hooks/useSocket.js`)

#### `useSocketEvent(eventName, handler, dependencies)`
- Safely listen to Socket.io events
- Automatically handles connection lifecycle
- Sets up listener when socket connects
- Calls handler immediately if socket already connected
- Properly cleans up on unmount

#### `useSocketEmit()`
- Returns a function to safely emit Socket.io events
- Checks connection status before emitting
- Provides clear warnings if not connected

#### `useSocketConnected()`
- Hook to check socket connection status
- Can be used to conditionally render UI

### 3. Updated App.js (`client/src/App.js`)

**Before** (Complex manual setup):
```javascript
const socket = initializeSocket(token);
socket.connect();

const handlePostUpdate = (event) => { /* ... */ };

const setupPostUpdateListener = (socket) => {
  socket.on('post:update', handlePostUpdate);
};

onSocketConnected(setupPostUpdateListener);

if (socket.connected) {
  setupPostUpdateListener(socket);
}

return () => {
  offSocketConnected(setupPostUpdateListener);
  socket.off('post:update', handlePostUpdate);
  disconnectSocket();
};
```

**After** (Clean hook usage):
```javascript
useEffect(() => {
  if (!token) return;
  const socket = initializeSocket(token);
  socket.connect();
  return () => disconnectSocket();
}, [token]);

const handlePostUpdate = useCallback((event) => { /* ... */ }, [dispatch]);
useSocketEvent('post:update', handlePostUpdate, [handlePostUpdate]);
```

### 4. Updated NotificationProvider (`client/src/components/NotificationProvider.jsx`)

**Before** (28 lines of complex logic):
```javascript
useEffect(() => {
  if (!token || !user) return;
  try {
    const socket = getSocket();
    const handleNotification = (notification) => { /* ... */ };
    
    if (socket.connected) {
      socket.on('notification', handleNotification);
    } else {
      const onConnect = () => {
        socket.on('notification', handleNotification);
      };
      socket.once('connect', onConnect);
      return () => {
        socket.off('connect', onConnect);
        socket.off('notification', handleNotification);
      };
    }
    // ... more complex logic
  } catch (err) { /* ... */ }
}, [token, user, dispatch, notify]);
```

**After** (4 lines with hook):
```javascript
const handleNotification = useCallback((notification) => { /* ... */ }, [dispatch, notify]);

useSocketEvent(
  token && user ? 'notification' : null, 
  handleNotification, 
  [handleNotification]
);
```

## Benefits

### 1. **No More Race Conditions**
- Components can safely attach listeners before socket connects
- Event emitter pattern ensures listeners are called when socket is ready
- No need to manually check `socket.connected`

### 2. **Cleaner Code**
- Reduced from ~50 lines to ~5 lines per component
- No try-catch blocks needed
- No manual connection state management

### 3. **Better Developer Experience**
- Simple `useSocketEvent` hook for any component
- Declarative API - just specify event name and handler
- Automatic cleanup on unmount

### 4. **Robust Connection Handling**
- Works whether socket connects before or after component mounts
- Handles reconnections automatically
- Proper cleanup prevents memory leaks

### 5. **Reusable Pattern**
- Any component can now easily use Socket.io
- Consistent pattern across the application
- Easy to add new real-time features

## Example Usage

### For any component that needs Socket.io:

```javascript
import { useSocketEvent, useSocketEmit } from 'hooks/useSocket';

function MyComponent() {
  const emit = useSocketEmit();
  
  // Listen for events
  useSocketEvent('custom:event', (data) => {
    console.log('Received:', data);
  }, []);
  
  // Emit events
  const sendMessage = () => {
    emit('custom:event', { message: 'Hello!' });
  };
  
  return <button onClick={sendMessage}>Send</button>;
}
```

## Testing Recommendations

1. **Connection Timing**: Test components mounting before/after socket connects
2. **Reconnection**: Verify listeners re-attach after disconnection
3. **Multiple Tabs**: Test multiple browser tabs connecting simultaneously
4. **Token Changes**: Verify socket reconnects with new token
5. **Component Unmount**: Ensure no memory leaks when components unmount

## Migration Notes

- All existing Socket.io functionality preserved
- No breaking changes to Socket.io server configuration
- Components using the old pattern will continue to work
- Recommended to migrate components to use `useSocketEvent` hook for cleaner code
- The event emitter is internal and doesn't affect external Socket.io events
