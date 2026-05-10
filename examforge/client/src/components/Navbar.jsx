import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate(role === 'teacher' ? '/teacher/login' : '/student/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const isActive = (path) => location.pathname === path;
  const linkCls = (path) =>
    `px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 no-underline ${
      isActive(path)
        ? 'text-primary-light bg-primary/10'
        : 'text-ink-dim hover:text-ink hover:bg-card'
    }`;

  return (
    <nav
      id="main-navbar"
      className="sticky top-0 z-50 h-16 px-6 border-b border-line
                 bg-[rgba(10,14,26,0.85)] backdrop-blur-2xl"
    >
      <div className="max-w-7xl mx-auto h-full flex items-center gap-8">
        {/* Logo */}
        <Link
          to={role === 'teacher' ? '/teacher/dashboard' : '/student/join'}
          className="flex items-center gap-2 flex-shrink-0 no-underline"
        >
          <span className="text-2xl">⚡</span>
          <span className="text-xl font-extrabold bg-gradient-to-br from-white to-primary-light
                           bg-clip-text text-transparent tracking-tight">
            ExamForge
          </span>
        </Link>

        {/* Nav links (teacher) */}
        {role === 'teacher' && (
          <div className="flex items-center gap-1 flex-1">
            <Link to="/teacher/dashboard"       className={linkCls('/teacher/dashboard')}>Dashboard</Link>
            <Link to="/teacher/exams/create"    className={linkCls('/teacher/exams/create')}>New Exam</Link>
            <Link to="/teacher/polls/create"    className={linkCls('/teacher/polls/create')}>New Poll</Link>
          </div>
        )}

        {/* User section */}
        {user && (
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark
                            flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="hidden md:flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink whitespace-nowrap">{user.name}</span>
              <span className="text-xs text-ink-muted">
                {role === 'teacher' ? '👩‍🏫 Teacher' : '🎓 Student'}
              </span>
            </div>
            <button id="navbar-logout-btn" className="btn btn-ghost btn-sm flex-shrink-0" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
