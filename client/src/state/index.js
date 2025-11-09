import { createSlice } from "@reduxjs/toolkit";
import { initializeSocket, disconnectSocket } from "../utils/socketClient";

// Initialize with data from localStorage if available
const loadInitialState = () => {
  try {
    return {
      mode: localStorage.getItem("mode") || "light",
      user: JSON.parse(localStorage.getItem("user")) || null,
      token: localStorage.getItem("token") || null,
    };
  } catch (error) {
    console.error("Error loading state from localStorage:", error);
    return {
      mode: "light",
      user: null,
      token: null,
    };
  }
};

const initialState = loadInitialState();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("mode", state.mode);
    },
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      // Persist auth info to local storage
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
      
      // Initialize and connect socket
      if (action.payload.token) {
        const socket = initializeSocket(action.payload.token);
        socket.connect();
      }
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      // Clear persisted auth info
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      
      // Disconnect socket
      disconnectSocket();
    },
    setFriends: (state, action) => {
      if (state.user) {
        state.user.friends = action.payload.friends;
      } else {
        console.error("user friends non-existent :(");
      }
    },
    setUserProfileViewsTotal: (state, action) => {
      const { profileViewsTotal } = action.payload || {};
      if (state.user && typeof profileViewsTotal === 'number') {
        state.user.profileViewsTotal = profileViewsTotal;
      }
    },
  },
});

export const { 
  setMode, 
  setLogin, 
  setLogout, 
  setFriends, 
  setUserProfileViewsTotal,
} = authSlice.actions;

export default authSlice.reducer;
