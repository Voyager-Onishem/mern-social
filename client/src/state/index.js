import { createSlice } from "@reduxjs/toolkit";

// Initialize with data from localStorage if available
const loadInitialState = () => {
  try {
    return {
      mode: localStorage.getItem("mode") || "light",
      user: JSON.parse(localStorage.getItem("user")) || null,
      token: localStorage.getItem("token") || null,
      posts: [],
      postsLoading: false,
      sessionSeenPostIds: {}, // Feature 26: track which post IDs have been counted locally this session
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasMore: false
      },
    };
  } catch (error) {
    console.error("Error loading state from localStorage:", error);
    return {
      mode: "light",
      user: null,
      token: null,
      posts: [],
      postsLoading: false,
      sessionSeenPostIds: {},
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasMore: false
      },
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
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      // Clear persisted auth info
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    setFriends: (state, action) => {
      if (state.user) {
        state.user.friends = action.payload.friends;
      } else {
        console.error("user friends non-existent :(");
      }
    },
    setPosts: (state, action) => {
      state.posts = action.payload.posts;
      state.postsLoading = false;
      // If pagination information is provided, update it
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
    },
    setPostsLoading: (state, action) => {
      state.postsLoading = !!action.payload;
    },
    appendPosts: (state, action) => {
      // Append new posts to the existing array
      const newPosts = action.payload.posts || [];
      // Filter out duplicates based on _id
      const uniqueNewPosts = newPosts.filter(newPost => 
        !state.posts.some(existingPost => existingPost._id === newPost._id)
      );
      state.posts = [...state.posts, ...uniqueNewPosts];
      state.postsLoading = false;
      // Update pagination information
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
    },
    setPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload
      };
    },
    setPost: (state, action) => {
      const updatedPosts = state.posts.map((post) => {
        if (post._id === action.payload.post._id) return action.payload.post;
        return post;
      });
      state.posts = updatedPosts;
    },
    addPost: (state, action) => {
      const p = action.payload.post;
      if (!p || !p._id) return;
      if (state.posts.find(existing => existing._id === p._id)) return; // avoid duplicates
      state.posts = [p, ...state.posts];
    },
    incrementPostImpression: (state, action) => {
      const { postId, amount = 1 } = action.payload || {};
      if (!postId) return;
      const idx = state.posts.findIndex(p => p._id === postId);
      if (idx !== -1) {
        const current = state.posts[idx].impressions || 0;
        state.posts[idx] = { ...state.posts[idx], impressions: current + amount };
      }
    },
    markPostSeenThisSession: (state, action) => {
      const { postId } = action.payload || {};
      if (postId) state.sessionSeenPostIds[postId] = true;
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
  setPosts, 
  setPost, 
  addPost, 
  incrementPostImpression, 
  markPostSeenThisSession, 
  setUserProfileViewsTotal,
  appendPosts,
  setPagination
} = authSlice.actions;
export const { setPostsLoading } = authSlice.actions;
export default authSlice.reducer;
