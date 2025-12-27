"use client"
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function Navbar(){
  const { user } = useAuth()
  const { palette, toggleDark } = useTheme()

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-14 flex items-center justify-between px-6 border-b z-10" style={{backgroundColor: 'var(--card-bg)'}}>
      <div className="flex items-center gap-4">
        <button className="text-xl font-bold" style={{color: 'var(--color-primary)'}}>EduNexus</button>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={toggleDark} className="px-3 py-1 border rounded nav-item">Toggle theme</button>
        <div className="flex items-center gap-2">
          <div className="text-sm">{user?.name || 'Guest'}</div>
        </div>
      </div>
    </header>
  )
}
