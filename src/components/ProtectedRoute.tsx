import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ('admin' | 'staff' | 'trainer' | 'member')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('auth_token');
  const userString = localStorage.getItem('auth_user');

  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized, redirect to their allowed home panel
    if (user.role === 'member') {
      return <Navigate to="/member/dashboard" replace />;
    } else if (user.role === 'trainer') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
};
