import React from 'react';
import Sidebar from './Sidebar';

function TeacherLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-x-hidden">
        {/* We can optionally add a minimal top bar here for breadcrumbs/notifications, 
            but for now we'll just render the content area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default TeacherLayout;
