import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Request interceptor: attach JWT token ─────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { role, logout } = useAuthStore.getState();
      
      // Auto-logout and redirect
      if (logout) logout();

      // Determine which login page to redirect to
      const redirectPath = role === 'student' ? '/student/login' : '/teacher/login';
      window.location.href = redirectPath;
    }
    return Promise.reject(error);
  }
);

export default api;
