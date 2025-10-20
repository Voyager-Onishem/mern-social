import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { NotificationProvider } from "components/NotificationProvider";
import store from "./state/store";
import { Provider } from "react-redux";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
// Expose store for non-hook utility logic (e.g., IntersectionObserver in PostsWidget) - limited use
if (typeof window !== 'undefined') {
  window.__APP_STORE__ = store;
}

// Expose store globally for non-hook utilities (e.g., IntersectionObserver in PostsWidget)
if (typeof window !== 'undefined') {
  window.__APP_STORE__ = store;
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistStore(store)}>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
