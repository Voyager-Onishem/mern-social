import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import React from "react";

const RequireAuth = ({ children }) => {
  // Updated to access token from the new Redux structure
  const isAuth = Boolean(useSelector((state) => state.auth?.token));
  const location = useLocation();

  if (!isAuth) {
    return (
      <Navigate 
        to="/" 
        state={{ from: location, message: "Please login to continue." }} 
        replace 
      />
    );
  }
  return children;
};

export default RequireAuth;
