// Debug utility to log Redux state changes
export const logReduxState = () => {
  if (typeof window !== 'undefined' && window.__APP_STORE__) {
    const state = window.__APP_STORE__.getState();
    console.log('Current Redux State:', state);
    return state;
  }
  return null;
};

// Debug utility to log authentication state specifically
export const logAuthState = () => {
  if (typeof window !== 'undefined' && window.__APP_STORE__) {
    const state = window.__APP_STORE__.getState();
    console.log('Auth State:', {
      token: state.auth?.token ? 'Token exists' : 'No token',
      user: state.auth?.user ? `User: ${state.auth.user.firstName} ${state.auth.user.lastName}` : 'No user',
      mode: state.auth?.mode
    });
    return state.auth;
  }
  return null;
};