import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useNetworkStatus } from '../utils/networkResilience';

/**
 * Global network status indicator
 * Shows when the app is offline or has poor connection
 */
const NetworkStatusIndicator = () => {
  const { isOnline, status } = useNetworkStatus();
  const [showOffline, setShowOffline] = React.useState(!isOnline);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Show "Back online" message briefly
      setTimeout(() => {
        setShowOffline(false);
      }, 3000);
    } else {
      setShowOffline(false);
    }
  }, [isOnline, wasOffline]);

  if (!showOffline) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        animation: 'slideDown 0.3s ease-out',
        '@keyframes slideDown': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
      }}
    >
      <Alert
        severity={isOnline ? 'success' : 'warning'}
        sx={{
          borderRadius: 0,
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2">
          {isOnline ? (
            <>
              ✓ Back online - your changes have been synced
            </>
          ) : (
            <>
              ⚠️ No internet connection - some features may be unavailable
            </>
          )}
        </Typography>
      </Alert>
    </Box>
  );
};

export default NetworkStatusIndicator;
