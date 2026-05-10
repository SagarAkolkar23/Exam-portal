import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const store = useAuthStore();
  // We use hydration state to avoid SSR/initial mismatch, and ensure the store is ready
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const value = {
    user: store.user,
    role: store.role,
    token: store.token,
    loading: !hydrated,
    isAuthenticated: !!store.token,
    isTeacher: store.role === 'teacher',
    isStudent: store.role === 'student',
    login: store.login,
    logout: store.logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
