import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost, setPost } from 'state';
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";
import RequireAuth from "components/RequireAuth";

function App() {
  const mode = useSelector((state) => state.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const token = useSelector(state => state.token);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) return; // only connect when authenticated
    const API_URL = process.env.REACT_APP_API_URL;
    const ev = new EventSource(`${API_URL.replace(/\/$/, '')}/realtime?token=${encodeURIComponent(token)}`, { withCredentials: false });
    ev.onmessage = (msg) => {
      if (!msg?.data) return;
      try {
        const payload = JSON.parse(msg.data);
        switch (payload.type) {
          case 'post:new':
            if (payload.post) dispatch(addPost({ post: payload.post }));
            break;
          case 'post:like':
          case 'comment:add':
          case 'comment:edit':
          case 'comment:delete':
            if (payload.post) dispatch(setPost({ post: payload.post }));
            break;
          default:
            break;
        }
      } catch {}
    };
    ev.onerror = () => {
      // Auto-reconnect by closing; useEffect dependency will re-run if token unchanged? add a timeout
      try { ev.close(); } catch {}
      // Basic backoff could be added
    };
    return () => { try { ev.close(); } catch {} };
  }, [token, dispatch]);
  // const isAuth = Boolean(useSelector((state) => state.token));

  return (
    <div className="app">
      <BrowserRouter>
  <ThemeProvider theme={theme}>
          <CssBaseline />
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
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
