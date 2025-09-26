import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "light",
  user: null,
  token: null,
  posts: [],
  postsLoading: false,
  sessionSeenPostIds: {}, // Feature 26: track which post IDs have been counted locally this session
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
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
    },
    setPostsLoading: (state, action) => {
      state.postsLoading = !!action.payload;
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

export const { setMode, setLogin, setLogout, setFriends, setPosts, setPost, addPost, incrementPostImpression, markPostSeenThisSession, setUserProfileViewsTotal } =
  authSlice.actions;
export const { setPostsLoading } = authSlice.actions;
export default authSlice.reducer;
