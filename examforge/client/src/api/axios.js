import axios from 'axios';

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
    const token = localStorage.getItem('examforge_token');
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
      // Auto-logout and redirect
      localStorage.removeItem('examforge_token');
      localStorage.removeItem('examforge_user');
      localStorage.removeItem('examforge_role');

      // Determine which login page to redirect to
      const role = localStorage.getItem('examforge_role');
      const redirectPath = role === 'student' ? '/student/login' : '/teacher/login';
      window.location.href = redirectPath;
    }
    return Promise.reject(error);
  }
);

export default api;
