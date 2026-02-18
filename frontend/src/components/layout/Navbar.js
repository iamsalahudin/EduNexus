"use client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { UserCircle, ChevronDown, Moon, Sun } from 'lucide-react'

export default function Navbar({ isHidden, setIsHidden }) {
  const { user, logout } = useAuth();
  const { toggleDark, dark } = useTheme();
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  const roleSegment = useMemo(() => {
    if (!pathname) return ''
    return `${pathname.split('/')[1] || ''}`
  }, [pathname])

  const canSeeSettings = roleSegment === 'admin' || roleSegment === 'principal'
  const canSeeTheme = roleSegment === 'admin'

  const profileHref = canSeeSettings ? `/${roleSegment}/settings/profile` : null
  const settingsHref = canSeeSettings ? `/${roleSegment}/settings` : null
  const themeHref = canSeeTheme ? `/${roleSegment}/settings/theme` : null

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  async function handleLogout() {
    setOpen(false)
    await logout()
    router.push('/login')
  }

  return (
    <header
      className={`fixed top-0 right-0 h-14 flex items-center justify-between px-6 border-b z-20
        transition-all duration-300
        left-0 ${isHidden ? 'lg:left-0' : 'lg:left-64'}
      `}
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      <div className="flex items-center gap-4">
        <button
          className={`px-2 py-1 border rounded nav-item transition-transform duration-300 ${isHidden ? '' : 'rotate-90'}`}
          onClick={() => setIsHidden(prev => !prev)}
        >
          ☰
        </button>

        <span
          className="text-xl font-bold"
          style={{ color: "var(--color-primary)" }}
        >
          EduNexus
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleDark}
          className="px-1 py-1 rounded nav-item inline-flex items-center justify-center"
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="px-3 py-1 border rounded nav-item inline-flex items-center gap-2"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <UserCircle className="w-5 h-5" />
            <span className="text-sm">{user?.name || user?.email || 'Guest'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {open ? (
            <div
              className="absolute right-0 mt-2 w-56 rounded border bg-[--card-bg] shadow"
              role="menu"
            >
              <div className="px-3 py-2 border-b">
                <div className="text-sm font-medium">{user?.name || 'Guest'}</div>
                <div className="text-xs text-gray-600 break-all">{user?.email || ''}</div>
              </div>

              {profileHref ? (
                <Link onClick={() => setOpen(false)} href={profileHref} className="block px-3 py-2 text-sm nav-item">
                  Profile
                </Link>
              ) : null}

              {settingsHref ? (
                <Link onClick={() => setOpen(false)} href={settingsHref} className="block px-3 py-2 text-sm nav-item">
                  Settings
                </Link>
              ) : null}

              {themeHref ? (
                <Link onClick={() => setOpen(false)} href={themeHref} className="block px-3 py-2 text-sm nav-item">
                  Theme
                </Link>
              ) : null}

              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm nav-item border-t">
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
