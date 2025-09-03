import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import React from "react";

const RequireAuth = ({ children }) => {
  const isAuth = Boolean(useSelector((state) => state.token));
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
