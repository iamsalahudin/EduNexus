"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar(){
  const pathname = usePathname()

  function isActive(href){
    if(!pathname) return false
    // Active only when path equals the link exactly — do not highlight for subpages
    return pathname === href
  }

  return (
    <aside className="w-64 border-r hidden md:block fixed left-0 top-0 h-screen z-20 overflow-auto" style={{backgroundColor: 'var(--card-bg)'}}>
      <div className="p-4">
        <div className="text-lg font-semibold">Admin</div>
        <nav className="mt-4 flex flex-col gap-2">
          <Link className={`px-3 py-2 rounded nav-item ${isActive('/admin') ? 'font-semibold' : ''}`} href="/admin" style={isActive('/admin') ? {backgroundColor:'var(--color-primary)', color:'var(--color-text-light)'} : undefined}>Overview</Link>
          <Link className={`px-3 py-2 rounded nav-item ${isActive('/admin/settings/theme') ? 'font-semibold' : ''}`} href="/admin/settings/theme" style={isActive('/admin/settings/theme') ? {backgroundColor:'var(--color-primary)', color:'var(--color-text-light)'} : undefined}>Theme</Link>
          <Link className={`px-3 py-2 rounded nav-item ${isActive('/admin/fees') ? 'font-semibold' : ''}`} href="/admin/fees" style={isActive('/admin/fees') ? {backgroundColor:'var(--color-primary)', color:'var(--color-text-light)'} : undefined}>Fees</Link>
          <Link className={`px-3 py-2 rounded nav-item ${isActive('/admin/attendance') ? 'font-semibold' : ''}`} href="/admin/attendance" style={isActive('/admin/attendance') ? {backgroundColor:'var(--color-primary)', color:'var(--color-text-light)'} : undefined}>Attendance</Link>
          <Link className={`px-3 py-2 rounded nav-item ${isActive('/admin/timetable') ? 'font-semibold' : ''}`} href="/admin/timetable" style={isActive('/admin/timetable') ? {backgroundColor:'var(--color-primary)', color:'var(--color-text-light)'} : undefined}>Timetable</Link>
        </nav>
      </div>
    </aside>
  )
}
