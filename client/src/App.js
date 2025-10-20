import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";
import CreateAdPage from "scenes/createAdPage";
import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost, setPost } from 'state';
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";
import RequireAuth from "components/RequireAuth";
import ErrorBoundary from "components/ErrorBoundary";
import TokenSynchronizer from "components/TokenSynchronizer";
import NetworkStatusMonitor from "components/NetworkStatusMonitor";

function App() {
  // Updated to access mode and token from the new Redux structure
  const mode = useSelector((state) => state.auth?.mode || "light");
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const token = useSelector(state => state.auth?.token);
  const dispatch = useDispatch();

  const sseBackoffRef = useRef({ attempt: 0, timer: null });
  const pollTimerRef = useRef(null);
  const batchRef = useRef({ pending: [], flushTimer: null });
  const lastEventTsRef = useRef(Date.now());

  useEffect(() => {
    if (!token) return; // only connect when authenticated
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001';
    let stopped = false;

    // Helper function to check if navigator is online
    const isOnline = () => {
      return typeof navigator !== 'undefined' && navigator.onLine !== false;
    };

    function startPollingFallback() {
      if (pollTimerRef.current) return; // already polling
      console.log('Starting polling fallback for realtime updates...');
      
      const poll = async () => {
        if (stopped) return;
        
        // Only poll if we're online
        if (!isOnline()) {
          pollTimerRef.current = setTimeout(poll, 15000); // Try again in 15s
          return;
        }
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
          
          const res = await fetch(
            `${API_URL.replace(/\/$/, '')}/posts`, 
            { 
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal
            }
          );
          
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json().catch(() => []);
            if (Array.isArray(data)) {
              // Minimal diffing: just batch set posts as updates (could be optimized)
              // We use existing setPost on each changed post for simplicity
              data.forEach(p => batchEvent({ type: 'snapshot:post', post: p }));
            }
          }
        } catch (err) {
          console.log('Polling error:', err.name === 'AbortError' ? 'timeout' : err.message);
        }
        
        // Schedule next poll with adaptive timing based on online status
        const interval = isOnline() ? 10000 : 30000; // 10s when online, 30s when offline
        pollTimerRef.current = setTimeout(poll, interval);
      };
      
      poll();
    }

    function batchEvent(evt) {
      if (!evt) return;
      batchRef.current.pending.push(evt);
      if (!batchRef.current.flushTimer) {
        batchRef.current.flushTimer = setTimeout(() => {
          const items = batchRef.current.pending.splice(0, batchRef.current.pending.length);
          batchRef.current.flushTimer = null;
          // Coalesce and dispatch
          for (const payload of items) {
            switch (payload.type) {
              case 'post:new':
                if (payload.post) dispatch(addPost({ post: payload.post }));
                break;
              case 'post:like':
              case 'comment:add':
              case 'comment:edit':
              case 'comment:delete':
              case 'snapshot:post':
                if (payload.post) dispatch(setPost({ post: payload.post }));
                break;
              default:
                break;
            }
          }
        }, 250); // 250ms coalescing window
      }
    }

    function openSSE() {
      // Create EventSource with auth token
      const ev = new EventSource(`${API_URL.replace(/\/$/, '')}/realtime?token=${encodeURIComponent(token)}`);
      console.log('Opening SSE connection');
      
      let heartbeatTimer = null;
      const HEARTBEAT_INTERVAL = 25000; // 25s - server should send something sooner ideally
      const MAX_SILENCE = 60000; // 60s before considering dead

      function scheduleHeartbeatCheck() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          // Check if we're online
          if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            console.log('Device is offline, closing SSE connection');
            try { ev.close(); } catch (err) { console.error('Error closing SSE:', err); }
            return;
          }
          
          const silence = Date.now() - lastEventTsRef.current;
          if (silence > MAX_SILENCE) {
            console.log(`SSE silent for ${silence}ms, forcing reconnect`);
            // Force reconnect
            try { ev.close(); } catch (err) { console.error('Error closing SSE:', err); }
          } else if (silence > HEARTBEAT_INTERVAL) {
            // Perform a lightweight health check to keep the connection warm
            console.log('Performing SSE health check');
            fetch(`${API_URL}/auth/ping`, { 
              headers: { Authorization: `Bearer ${token}` },
              signal: AbortSignal.timeout(3000) // 3s timeout
            }).catch(() => {}); // Ignore errors, just keeping connection warm
          }
        }, HEARTBEAT_INTERVAL);
      }

      scheduleHeartbeatCheck();

      // Handle incoming messages
      ev.onmessage = (msg) => {
        lastEventTsRef.current = Date.now();
        sseBackoffRef.current.attempt = 0; // reset backoff on any message
        
        // Process message
        if (!msg?.data) return;
        try {
          const payload = JSON.parse(msg.data);
          if (payload.type === 'ping') {
            console.log('SSE ping received');
            return; // ignore pings
          }
          batchEvent(payload);
        } catch (err) {
          console.warn('Error processing SSE message:', err);
        }
      };
      
      // Handle errors
      ev.onerror = (err) => {
        console.error('SSE error:', err);
        try { ev.close(); } catch {}
        
        // Schedule reconnect with backoff
        const attempt = sseBackoffRef.current.attempt++;
        const backoff = Math.min(30000, 1000 * Math.pow(1.5, attempt)); // Max 30s
        console.log(`SSE error, reconnecting in ${backoff}ms (attempt ${attempt})`);
        
        setTimeout(() => {
          if (!stopped) { // Only reconnect if not stopped
            connectToSSE();
          }
        }, backoff);
      };
      
      // Handle connection open
      ev.onopen = () => {
        console.log('SSE connection opened');
        sseBackoffRef.current.attempt = 0; // reset backoff on successful connection
        lastEventTsRef.current = Date.now(); // reset last event timestamp
      };
      
      return ev;
    }

    let ev = null;
    
    // Function to handle SSE connection with retry
    function connectToSSE() {
      try {
        if (ev) {
          try { ev.close(); } catch {}
        }
        ev = openSSE();
      } catch (err) {
        console.error('Error connecting to SSE:', err);
        // Schedule reconnect with backoff
        const attempt = sseBackoffRef.current.attempt++;
        const backoff = Math.min(30000, 1000 * Math.pow(1.5, attempt)); // Max 30s
        console.log(`SSE connection error, retrying in ${backoff}ms (attempt ${attempt})`);
        
        setTimeout(() => {
          if (!stopped) {
            connectToSSE();
          }
        }, backoff);
      }
    }
    
    // Initial connection
    connectToSSE();

    // Monitor connection status regularly and reconnect if needed
    const reconWatcher = setInterval(() => {
      // Check if navigator is online
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return; // Don't attempt reconnect while offline
      }
      
      // Check if connection is closed
      if (ev && ev.readyState === 2) { // CLOSED
        console.log('SSE connection detected as closed, reconnecting...');
        connectToSSE();
      }
      
      // Check if we've been without updates for too long
      const silence = Date.now() - lastEventTsRef.current;
      if (silence > 120000) { // 2 minutes without any message
        console.log(`SSE silent for ${Math.round(silence/1000)}s, reconnecting...`);
        connectToSSE();
        
        // After prolonged silence, start polling fallback
        if (sseBackoffRef.current.attempt > 3) {
          console.log('Multiple SSE reconnection attempts failed, starting polling fallback');
          startPollingFallback();
        }
      }
    }, 15000); // Check every 15 seconds

    return () => {
      stopped = true;
      if (ev) { try { ev.close(); } catch {} }
      if (reconWatcher) clearInterval(reconWatcher);
      if (sseBackoffRef.current.timer) clearTimeout(sseBackoffRef.current.timer);
      if (batchRef.current.flushTimer) clearTimeout(batchRef.current.flushTimer);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [token, dispatch]);
  // const isAuth = Boolean(useSelector((state) => state.token));

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <TokenSynchronizer />
          <NetworkStatusMonitor />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route
                path="/home"
                element={
                  <RequireAuth>
                    <HomePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/create-ad"
                element={
                  <RequireAuth>
                    <CreateAdPage />
                  </RequireAuth>
                }
              />
            </Routes>
          </ErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
