'use client';

import ProfileDropdown from './ProfileDropdown';

export default function Navbar({ sidebarOpen, toggleSidebar, user }) {
  return (
    <header className="flex justify-between items-center p-4 bg-secondary text-white shadow-md">
      <button onClick={toggleSidebar} className="font-bold text-lg">
        {sidebarOpen ? '☰' : '☰'}
      </button>

      <div className="flex items-center gap-4">
        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
