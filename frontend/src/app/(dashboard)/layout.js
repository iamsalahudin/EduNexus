'use client';

import ChatWidget from '@/components/chat/ChatWidget';
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import SubHeader from '@/components/layout/SubHeader'
import ChatSubHeader from '@/components/layout/ChatSubHeader'
import routes from '@/components/layout/routes/routes'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation'

function normalizeRoleSegment(role) {
  const value = String(role || '').trim()
  if (!value) return ''

  const byRoleName = {
    Admin: 'admin',
    Principal: 'principal',
    Teacher: 'teacher',
    Student: 'student',
    Parent: 'parent',
    HR: 'hr',
    Finance: 'accountant',
    Reception: 'receptionist',
  }

  if (byRoleName[value]) return byRoleName[value]
  return value.toLowerCase()
}

export default function DashboardRoot({ children }){
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isLg, setIsLg] = useState(false)
  // Desktop: sidebar visible by default
  const [desktopHidden, setDesktopHidden] = useState(false)
  // Mobile: sidebar hidden by default
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const isHidden = isLg ? desktopHidden : !mobileOpen

  function normalizePath(path) {
    if (!path) return ''
    if (path === '/') return '/'
    return String(path).replace(/\/+$/, '')
  }

  // Proxy setter so Navbar can keep calling setIsHidden(prev => !prev)
  const setIsHidden = (valueOrUpdater) => {
    if (isLg) {
      setDesktopHidden((prev) => (typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater))
      return
    }

    setMobileOpen((prevOpen) => {
      const prevHidden = !prevOpen
      const nextHidden = typeof valueOrUpdater === 'function' ? valueOrUpdater(prevHidden) : valueOrUpdater
      return !nextHidden
    })
  }

  const roleSegment = useMemo(() => {
    if (!pathname) return ''
    return `${pathname.split('/')[1] || ''}`
  }, [pathname])

  const expectedRoleSegment = useMemo(() => normalizeRoleSegment(user?.role), [user?.role])

  const sidebarRouteSet = useMemo(() => {
    const roleRoutes = routes?.[roleSegment] || {}
    const values = Object.values(roleRoutes || {})
    return new Set(values.map((p) => normalizePath(p)))
  }, [roleSegment])

  const showSubHeader = useMemo(() => {
    if (!pathname) return false
    if (pathname.includes('/chat')) return false

    const current = normalizePath(pathname)
    // If it's one of the sidebar main pages, don't show SubHeader.
    if (sidebarRouteSet.has(current)) return false

    const parts = pathname.split('/').filter(Boolean)
    // overview is just '/role' (1 part). everything else is a sub-page
    return parts.length >= 2
  }, [pathname, sidebarRouteSet])

  const isChatRoute = useMemo(() => {
    return (pathname || '').includes('/chat')
  }, [pathname])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (!expectedRoleSegment || !roleSegment) return

    if (roleSegment !== expectedRoleSegment) {
      router.replace(`/${expectedRoleSegment}/__not-found__`)
    }
  }, [authLoading, user, roleSegment, expectedRoleSegment, router])

  const isRoleAllowed = !user || !roleSegment || !expectedRoleSegment || roleSegment === expectedRoleSegment

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 1024px)') // tailwind `lg`

    const onChange = () => {
      const nextIsLg = mq.matches
      setIsLg(nextIsLg)
      // Always close the mobile drawer when switching sizes
      if (nextIsLg) setMobileOpen(false)
    }

    onChange()

    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  useEffect(() => {
    if ((pathname || '').includes('/chat')) {
      setDesktopHidden(true)
      setMobileOpen(false)
    }
  }, [pathname])

  if (authLoading || !user || !isRoleAllowed) {
    return null
  }

  return (
    <div className="w-full min-h-screen flex bg-[var(--color-bg)] scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Sidebar isHidden={isHidden} onNavigate={() => setMobileOpen(false)} />

      {/* Mobile overlay (animates in/out) */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <div className={`w-full flex-1 flex flex-col transition-all duration-300 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isHidden ? 'ml-0 lg:ml-0' : 'ml-0 lg:ml-64'}`}>
        <Navbar isHidden={isHidden} setIsHidden={setIsHidden} />
        {isChatRoute ? <ChatSubHeader /> : null}
        <main className={`${isChatRoute ? 'pt-[104px]' : 'pt-16'} px-6`}>
          {showSubHeader ? <SubHeader /> : null}
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
