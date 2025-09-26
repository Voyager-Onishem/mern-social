import React from 'react';
import { Box, Button, Typography } from '@mui/material';

/**
 * Generic application-level error boundary.
 * Catches render/runtime errors in descendant React component tree.
 * Logs to console (could be extended to remote logging service later).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, ts: null };
  }

  static getDerivedStateFromError(error) {
    return { error, ts: Date.now() };
  }

  componentDidCatch(error, errorInfo) {
    // Basic console log; future: send to monitoring endpoint
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleReset = () => {
    // Allows parent to reset state without full reload if provided
    if (this.props.onReset) {
      try { this.props.onReset(); } catch {}
    }
    this.setState({ error: null, errorInfo: null, ts: null });
  };

  render() {
    const { error, errorInfo } = this.state;
    if (error) {
      const fallback = this.props.fallback;
      if (fallback) return typeof fallback === 'function' ? fallback({ error, errorInfo, reset: this.handleReset }) : fallback;
      return (
        <Box sx={{ p: 4, maxWidth: 640, m: '4rem auto', textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Something went wrong</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            An unexpected error occurred while rendering this section. You can try resetting the view or reloading the page.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button variant="contained" color="primary" onClick={this.handleReset}>Reset View</Button>
            <Button variant="outlined" color="secondary" onClick={this.handleReload}>Reload Page</Button>
          </Box>
          <Box sx={{ textAlign: 'left', background: '#111', color: '#eee', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: 12, maxHeight: 240, overflow: 'auto' }}>
            <div>{String(error && (error.message || error.toString()))}</div>
            {errorInfo?.componentStack && <pre style={{ whiteSpace: 'pre-wrap' }}>{errorInfo.componentStack}</pre>}
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
