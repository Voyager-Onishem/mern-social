import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  posts: [],
  loading: false,
  sessionSeenPostIds: {}, // Track which post IDs have been counted locally this session
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasMore: false
  },
};

export const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload.posts;
      state.loading = false;
      // If pagination information is provided, update it
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
    },
    setPostsLoading: (state, action) => {
      state.loading = !!action.payload;
    },
    appendPosts: (state, action) => {
      // Append new posts to the existing array
      const newPosts = action.payload.posts || [];
      // Filter out duplicates based on _id
      const uniqueNewPosts = newPosts.filter(newPost => 
        !state.posts.some(existingPost => existingPost._id === newPost._id)
      );
      state.posts = [...state.posts, ...uniqueNewPosts];
      state.loading = false;
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
    clearPosts: (state) => {
      state.posts = [];
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasMore: false
      };
      state.sessionSeenPostIds = {};
    },
  },
});

export const { 
  setPosts, 
  setPostsLoading,
  appendPosts,
  setPagination,
  setPost, 
  addPost, 
  incrementPostImpression, 
  markPostSeenThisSession,
  clearPosts,
} = postsSlice.actions;

export default postsSlice.reducer;
