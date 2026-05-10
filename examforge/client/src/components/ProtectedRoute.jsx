import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, role, redirectTo }) {
  const { isAuthenticated, role: userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 text-ink-dim">
        <div className="spinner spinner-lg" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = role === 'student' ? '/student/login' : '/teacher/login';
    return <Navigate to={redirectTo || loginPath} replace />;
  }

  if (role && userRole !== role) {
    const correctPath = userRole === 'teacher' ? '/teacher/dashboard' : '/student/join';
    return <Navigate to={correctPath} replace />;
  }

  return children;
}

export default ProtectedRoute;
