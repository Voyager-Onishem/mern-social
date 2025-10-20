// TokenSynchronizer ensures tokens are synchronized between Redux and localStorage
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const TokenSynchronizer = () => {
  const token = useSelector((state) => state.auth?.token);
  
  // When token changes in Redux, update localStorage
  useEffect(() => {
    if (token) {
      // Save token to localStorage when it changes in Redux
      localStorage.setItem("token", token);
      console.log("Token synchronized to localStorage");
    } else {
      // If token is null/undefined in Redux but exists in localStorage, don't remove it
      // This prevents issues during page reloads where Redux might initialize before token is loaded
      const localToken = localStorage.getItem("token");
      if (!localToken) {
        localStorage.removeItem("token");
        console.log("Token removed from localStorage");
      }
    }
  }, [token]);

  // Nothing to render - this is a utility component
  return null;
};

export default TokenSynchronizer;