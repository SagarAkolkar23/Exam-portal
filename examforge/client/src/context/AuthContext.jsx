import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'teacher' | 'student'
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Loading initial auth state

  // Restore auth from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('examforge_token');
    const storedUser = localStorage.getItem('examforge_user');
    const storedRole = localStorage.getItem('examforge_role');

    if (storedToken && storedUser && storedRole) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      } catch {
        // Corrupt storage — clear it
        localStorage.removeItem('examforge_token');
        localStorage.removeItem('examforge_user');
        localStorage.removeItem('examforge_role');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((tokenValue, userObj, roleValue) => {
    setToken(tokenValue);
    setUser(userObj);
    setRole(roleValue);
    localStorage.setItem('examforge_token', tokenValue);
    localStorage.setItem('examforge_user', JSON.stringify(userObj));
    localStorage.setItem('examforge_role', roleValue);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    localStorage.removeItem('examforge_token');
    localStorage.removeItem('examforge_user');
    localStorage.removeItem('examforge_role');
  }, []);

  const value = {
    user,
    role,
    token,
    loading,
    isAuthenticated: !!token,
    isTeacher: role === 'teacher',
    isStudent: role === 'student',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
