import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close, WifiOff, Wifi } from '@mui/icons-material';

/**
 * Component to monitor network connectivity and show notifications
 * when the network status changes
 */
const NetworkStatusMonitor = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    // Handler for when network comes online
    const handleOnline = () => {
      setOnline(true);
      setShowOnlineAlert(true);
    };

    // Handler for when network goes offline
    const handleOffline = () => {
      setOnline(false);
      setShowOfflineAlert(true);
    };

    // Register event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle closing the offline alert
  const handleCloseOffline = (event, reason) => {
    if (reason === 'clickaway') return;
    setShowOfflineAlert(false);
  };

  // Handle closing the online alert
  const handleCloseOnline = (event, reason) => {
    if (reason === 'clickaway') return;
    setShowOnlineAlert(false);
  };

  return (
    <>
      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={10000} // Show for 10 seconds
        onClose={handleCloseOffline}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity="warning"
          icon={<WifiOff />}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseOffline}
            >
              <Close fontSize="small" />
            </IconButton>
          }
          sx={{ width: '100%' }}
        >
          You are offline. Some features may be unavailable.
        </Alert>
      </Snackbar>

      {/* Online Alert */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={3000} // Show for 3 seconds
        onClose={handleCloseOnline}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity="success"
          icon={<Wifi />}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseOnline}
            >
              <Close fontSize="small" />
            </IconButton>
          }
          sx={{ width: '100%' }}
        >
          You are back online.
        </Alert>
      </Snackbar>
    </>
  );
};

export default NetworkStatusMonitor;