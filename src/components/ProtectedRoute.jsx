import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';

const readAuth = () => {
  const token = localStorage.getItem('token');
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    user = {};
  }
  return { token, user };
};

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const [{ token, user }, setAuth] = useState(readAuth);

  // Admin routes show an inline login form instead of bouncing the
  // visitor away, so they can sign in directly at /admin.
  if (requireAdmin) {
    if (!token || user.role !== 'admin') {
      return <AdminLogin onSuccess={() => setAuth(readAuth())} />;
    }
    return children;
  }

  // Other protected routes keep the original redirect behaviour.
  if (!token) {
    return <Navigate to="/account" replace />;
  }

  return children;
};

export default ProtectedRoute;
