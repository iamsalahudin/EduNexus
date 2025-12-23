'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NotificationPanel from './NotificationPanel';
import ProfileDropdown from './ProfileDropdown';

export default function AppShell({ children, role, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      {/* Sidebar */}
      <Sidebar role={role} open={sidebarOpen} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      {/* Optional Notification Panel */}
      <NotificationPanel />
    </div>
  );
}
