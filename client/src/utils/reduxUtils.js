// Function to get current token from Redux store
export const getCurrentToken = () => {
  // Get store from global window object
  const store = window.__APP_STORE__;
  
  if (!store) {
    throw new Error('Redux store not available');
  }
  
  const state = store.getState();
  return state.auth?.token;
};