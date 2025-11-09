import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";
import CreateAdPage from "scenes/createAdPage";
import HelpPage from "scenes/helpPage";
import { useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost, setPost } from 'state/postsSlice';
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";
import RequireAuth from "components/RequireAuth";
import ErrorBoundary from "components/ErrorBoundary";
import TokenSynchronizer from "components/TokenSynchronizer";
import NetworkStatusMonitor from "components/NetworkStatusMonitor";
import { initializeSocket, disconnectSocket } from "utils/socketClient";
import { useSocketEvent } from "hooks/useSocket";

function App() {
  // Updated to access mode and token from the new Redux structure
  const mode = useSelector((state) => state.auth?.mode || "light");
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const token = useSelector(state => state.auth?.token);
  const dispatch = useDispatch();

  // Initialize socket on app load if user is already logged in
  useEffect(() => {
    if (!token) return;
    
    const socket = initializeSocket(token);
    socket.connect();
    
    return () => {
      // Cleanup on unmount or token change
      disconnectSocket();
    };
  }, [token]);

  // Listen for post updates via Socket.io using the custom hook
  const handlePostUpdate = useCallback((event) => {
    if (!event) return;
    
    try {
      switch (event.type) {
        case 'post:new':
          if (event.post) dispatch(addPost({ post: event.post }));
          break;
        case 'post:like':
        case 'comment:add':
        case 'comment:edit':
        case 'comment:delete':
          if (event.post) dispatch(setPost({ post: event.post }));
          break;
        default:
          break;
      }
    } catch (err) {
      console.warn('Error processing post update:', err);
    }
  }, [dispatch]);

  useSocketEvent('post:update', handlePostUpdate, [handlePostUpdate]);

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
              <Route
                path="/help"
                element={<HelpPage />}
              />
            </Routes>
          </ErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
