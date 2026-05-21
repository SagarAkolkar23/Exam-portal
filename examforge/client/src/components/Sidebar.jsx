import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/teacher/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Exams',     path: '/teacher/exams',     matchPaths: ['/teacher/exams'], icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Students',  path: '/teacher/students',  matchPaths: ['/teacher/students'], icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Polls',     path: '/teacher/polls/create', matchPaths: ['/teacher/polls'], icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { name: 'Settings',  path: '/teacher/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  return (
    <aside className={`bg-[#f8f9fa] border-r border-line fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col transition-all duration-300 z-20 overflow-hidden ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Nav */}
      <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => {
                const isMatch = isActive || (item.matchPaths && item.matchPaths.some(p => window.location.pathname.startsWith(p)));
                return `flex items-center rounded-lg font-medium transition-colors ${
                  isOpen ? 'px-4 py-2.5 gap-3' : 'justify-center p-3'
                } ${
                  isMatch 
                    ? 'bg-primary-bg text-primary border-l-4 border-primary' 
                    : 'text-ink-dim hover:bg-slate-100 hover:text-ink border-l-4 border-transparent'
                }`;
              }}
              title={!isOpen ? item.name : undefined}
            >
              <svg className={`opacity-70 flex-shrink-0 ${isOpen ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {isOpen && <span className="text-sm truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="p-4 border-t border-line">
        <div 
          className={`flex items-center cursor-pointer hover:bg-slate-100 rounded-lg transition-colors group ${isOpen ? 'gap-3 px-2 py-2' : 'justify-center py-2'}`}
          title={!isOpen ? 'Logout' : undefined}
          onClick={!isOpen ? handleLogout : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-ink-dim overflow-hidden flex-shrink-0">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          {isOpen && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{user?.name}</div>
                <div className="text-xs text-ink-muted truncate">Profile</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="p-1.5 text-ink-muted hover:text-danger rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="Logout">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
