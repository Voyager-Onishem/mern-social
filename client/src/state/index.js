import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "light",
  user: null,
  token: null,
  posts: [],
  postsLoading: false,
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
  },
});

export const { setMode, setLogin, setLogout, setFriends, setPosts, setPost, addPost } =
  authSlice.actions;
export const { setPostsLoading } = authSlice.actions;
export default authSlice.reducer;
