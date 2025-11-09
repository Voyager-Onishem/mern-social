import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "./index";
import adsReducer from "./adsSlice";
import notificationsReducer from "./notificationsSlice";
import postsReducer, { clearPosts } from "./postsSlice";
import storage from "redux-persist/lib/storage";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

const persistConfig = { key: "root", storage, version: 1 };

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  ads: adsReducer,
  notifications: notificationsReducer,
  posts: postsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Middleware to clear posts on logout
const logoutMiddleware = (store) => (next) => (action) => {
  if (action.type === 'auth/setLogout') {
    // Clear posts when user logs out
    store.dispatch(clearPosts());
  }
  return next(action);
};

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(logoutMiddleware),
});

export default store;