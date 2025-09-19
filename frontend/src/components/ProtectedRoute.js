import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const location = useLocation();

  // 1. If user is not logged in, redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If user's role is not in the allowed list, redirect to login
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  // 3. If all checks pass, show the requested page
  return children;
};

export default ProtectedRoute;