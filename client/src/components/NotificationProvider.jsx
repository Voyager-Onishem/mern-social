import { createContext, useCallback, useContext, useState, useRef } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

const NotificationContext = createContext(null);

function SlideUp(props) {
  return <Slide {...props} direction="up" />;
}

export const NotificationProvider = ({ children }) => {
  const [queue, setQueue] = useState([]); // { id, message, severity, duration }
  const [current, setCurrent] = useState(null);
  const timerRef = useRef(null);

  const processQueue = useCallback(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
  }, [current, queue]);

  const notify = useCallback((message, { severity = 'info', duration = 3000 } = {}) => {
    setQueue(q => [...q, { id: Date.now() + Math.random(), message, severity, duration }]);
  }, []);

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
