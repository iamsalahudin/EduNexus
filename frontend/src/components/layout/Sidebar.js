"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar({ isHidden }) {
  const pathname = usePathname()

  function isActive(href) {
    if (!pathname) return false
    return pathname === href
  }

  return (
    <aside
      className={`w-64 border-r fixed left-0 top-0 h-screen z-20 overflow-auto bg-[--card-bg] transform transition-transform duration-300 ${
        isHidden ? '-translate-x-full' : 'translate-x-0'
      }`}
    >
      <div className="p-4">
        <div className="text-lg font-semibold">Admin</div>
        <nav className="mt-4 flex flex-col gap-2">
          <Link
            href="/admin"
            className={`px-3 py-2 rounded nav-item ${isActive('/admin') ? 'font-semibold' : ''}`}
            style={isActive('/admin') ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' } : undefined}
          >
            Overview
          </Link>

          <Link
            href="/admin/settings/theme"
            className={`px-3 py-2 rounded nav-item ${isActive('/admin/settings/theme') ? 'font-semibold' : ''}`}
            style={isActive('/admin/settings/theme') ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' } : undefined}
          >
            Theme
          </Link>

          <Link
            href="/admin/fees"
            className={`px-3 py-2 rounded nav-item ${isActive('/admin/fees') ? 'font-semibold' : ''}`}
            style={isActive('/admin/fees') ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' } : undefined}
          >
            Fees
          </Link>

          <Link
            href="/admin/attendance"
            className={`px-3 py-2 rounded nav-item ${isActive('/admin/attendance') ? 'font-semibold' : ''}`}
            style={isActive('/admin/attendance') ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' } : undefined}
          >
            Attendance
          </Link>

          <Link
            href="/admin/timetable"
            className={`px-3 py-2 rounded nav-item ${isActive('/admin/timetable') ? 'font-semibold' : ''}`}
            style={isActive('/admin/timetable') ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-text-light)' } : undefined}
          >
            Timetable
          </Link>
        </nav>
      </div>
    </aside>
  )
}
