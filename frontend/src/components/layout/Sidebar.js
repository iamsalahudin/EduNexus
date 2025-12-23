'use client';

export default function Sidebar({ role, open }) {
  const links = {
    admin: [
      { name: 'User Management', href: '/admin/users' },
      { name: 'Timetable', href: '/admin/timetable' },
      { name: 'Analytics', href: '/admin/analytics' },
    ],
    teacher: [
      { name: 'Attendance', href: '/teacher/attendance' },
      { name: 'Marks Entry', href: '/teacher/marks' },
    ],
    student: [
      { name: 'Homework', href: '/student/homework' },
      { name: 'Report Card', href: '/student/report' },
    ],
    // Add other roles similarly
  };

  return (
    <aside
      className={`bg-primary text-white w-64 transition-all ${
        open ? 'translate-x-0' : '-translate-x-64'
      }`}
    >
      <div className="p-4 font-bold text-lg">{role.toUpperCase()} Panel</div>
      <nav className="mt-6 flex flex-col gap-2">
        {links[role]?.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="px-4 py-2 hover:bg-primary/80 rounded"
          >
            {link.name}
          </a>
        ))}
      </nav>
    </aside>
  );
}
