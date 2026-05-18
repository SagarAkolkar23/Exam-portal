import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

function TeacherLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Full-width Top Bar */}
      <header className="h-16 bg-white border-b border-line flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 rounded-md hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Toggle Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href='/teacher/dashboard'}>
            <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center font-bold text-xs">
              {`>`}_
            </div>
            <span className="text-xl font-extrabold text-primary tracking-tight">ExamForge</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => navigate('/teacher/polls/create')}
          >
            + Create Poll
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => navigate('/teacher/exams/create')}
          >
            + Create Exam
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 flex flex-col min-h-[calc(100vh-4rem)] overflow-x-hidden ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default TeacherLayout;
