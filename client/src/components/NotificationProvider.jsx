import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { addNotification, setNotifications } from '../state/notificationsSlice';
import { get } from '../utils/apiClient';
import { useSocketEvent } from '../hooks/useSocket';

const NotificationContext = createContext(null);

function SlideUp(props) {
  return <Slide {...props} direction="up" />;
}

export const NotificationProvider = ({ children }) => {
  const [queue, setQueue] = useState([]); // { id, message, severity, duration }
  const [current, setCurrent] = useState(null);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await get('/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // response is already the JSON data, not wrapped in .data
      dispatch(setNotifications(response));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [token, dispatch]);

  // Fetch notifications on mount
  useEffect(() => {
    if (token && user) {
      fetchNotifications();
    }
  }, [token, user, fetchNotifications]);

  const processQueue = useCallback(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
  }, [current, queue]);

  const notify = useCallback((message, { severity = 'info', duration = 3000 } = {}) => {
    setQueue(q => [...q, { id: Date.now() + Math.random(), message, severity, duration }]);
  }, []);

  // Listen for real-time notifications via Socket.io using custom hook
  const handleNotification = useCallback((notification) => {
    if (!notification || !notification._id) return;
    
    console.log('📩 Received real-time notification:', {
      id: notification._id,
      type: notification.type,
      message: notification.message
    });
    
    dispatch(addNotification(notification));
    notify(notification.message, { severity: 'info', duration: 5000 });
  }, [dispatch, notify]);

  // Only set up socket listener if user is authenticated
  useSocketEvent(
    token && user ? 'notification' : null, 
    handleNotification, 
    [handleNotification]
  );

  const handleClose = () => {
    setCurrent(null);
  };

  // when current changes and is set, schedule next
  if (!current) {
    processQueue();
  }

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <Snackbar
        key={current?.id}
        open={!!current}
        autoHideDuration={current?.duration}
        onClose={handleClose}
        TransitionComponent={SlideUp}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert variant="filled" onClose={handleClose} severity={current?.severity || 'info'} sx={{ width: '100%' }}>
          {current?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx.notify;
};
