'use client';

export default function ProfileDropdown({ user }) {
  return (
    <div className="relative">
      <button className="bg-primary px-3 py-1 rounded text-white">
        {user?.name || 'User'}
      </button>
      {/* Dropdown items (logout, profile settings) can be added */}
    </div>
  );
}
