import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";
import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost, setPost } from 'state';
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";
import RequireAuth from "components/RequireAuth";
import ErrorBoundary from "components/ErrorBoundary";

function App() {
  const mode = useSelector((state) => state.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const token = useSelector(state => state.token);
  const dispatch = useDispatch();

  const sseBackoffRef = useRef({ attempt: 0, timer: null });
  const pollTimerRef = useRef(null);
  const batchRef = useRef({ pending: [], flushTimer: null });
  const lastEventTsRef = useRef(Date.now());

  useEffect(() => {
    if (!token) return; // only connect when authenticated
    const API_URL = process.env.REACT_APP_API_URL;
    let stopped = false;

    function startPollingFallback() {
      if (pollTimerRef.current) return; // already polling
      const poll = async () => {
        if (stopped) return;
        try {
          const res = await fetch(`${API_URL.replace(/\/$/, '')}/posts`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json().catch(() => []);
          if (Array.isArray(data)) {
            // Minimal diffing: just batch set posts as updates (could be optimized)
            // We use existing setPost on each changed post for simplicity
            data.forEach(p => batchEvent({ type: 'snapshot:post', post: p }));
          }
        } catch {}
        pollTimerRef.current = setTimeout(poll, 10000); // 10s interval
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
      const ev = new EventSource(`${API_URL.replace(/\/$/, '')}/realtime?token=${encodeURIComponent(token)}`);
      let heartbeatTimer = null;
      const HEARTBEAT_INTERVAL = 25000; // 25s - server should send something sooner ideally
      const MAX_SILENCE = 60000; // 60s before considering dead

      function scheduleHeartbeatCheck() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          const silence = Date.now() - lastEventTsRef.current;
          if (silence > MAX_SILENCE) {
            // Force reconnect
            try { ev.close(); } catch {}
          } else if (silence > HEARTBEAT_INTERVAL) {
            // Send a comment line to keep connection (cannot from client on SSE) -> rely on server future ping
            // Placeholder: could trigger a lightweight fetch to keep session warm
          }
        }, HEARTBEAT_INTERVAL);
      }

      scheduleHeartbeatCheck();

      ev.onmessage = (msg) => {
        lastEventTsRef.current = Date.now();
        sseBackoffRef.current.attempt = 0; // reset backoff on any message
        if (!msg?.data) return;
        try {
          const payload = JSON.parse(msg.data);
          if (payload.type === 'ping') return; // ignore pings
          batchEvent(payload);
        } catch {}
      };
      ev.onerror = () => {
        try { ev.close(); } catch {}
      };
      ev.onopen = () => {
        sseBackoffRef.current.attempt = 0;
      };
      return ev;
    }

    let ev = openSSE();

    const reconWatcher = setInterval(() => {
      if (ev && ev.readyState === 2) { // CLOSED
        const attempt = ++sseBackoffRef.current.attempt;
        const delay = Math.min(30000, Math.pow(2, attempt) * 500 + Math.random() * 500);
        if (sseBackoffRef.current.timer) clearTimeout(sseBackoffRef.current.timer);
        sseBackoffRef.current.timer = setTimeout(() => {
          if (stopped) return;
          try { ev.close(); } catch {}
          ev = openSSE();
        }, delay);
        if (attempt > 5) {
          // After several failed attempts, start polling fallback (will continue in parallel)
            startPollingFallback();
        }
      }
    }, 3000);

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
            </Routes>
          </ErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
