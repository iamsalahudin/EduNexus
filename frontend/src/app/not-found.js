'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import routes from '@/components/layout/routes/routes'
import { Button, ButtonLink, Card } from '@/components/ui'

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase()
  return role
}

function dashboardHrefForRole(role) {
  const r = normalizeRole(role)
  const dashboard = routes?.[r]?.dashboard
  if (typeof dashboard === 'string' && dashboard.trim()) return dashboard
  if (r) return `/${r}`
  return '/login'
}

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()

  const roleFromPath = useMemo(() => {
    const parts = String(pathname || '').split('/').filter(Boolean)
    return parts[0] || ''
  }, [pathname])

  const mainDashboardHref = useMemo(() => {
    return dashboardHrefForRole(roleFromPath)
  }, [roleFromPath])

  function handleBack() {
    if (typeof window === 'undefined') return

    // If there is no meaningful history entry, go to main dashboard instead.
    if (window.history.length <= 1) {
      router.push(mainDashboardHref)
      return
    }

    router.back()
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Card className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="min-w-0">
              <div className="text-6xl sm:text-7xl font-extrabold tracking-tight leading-none">
                <span className="text-[color:var(--color-primary)]">404</span>
              </div>
              <div className="mt-3 text-lg font-semibold">
                This page wandered off.
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Looks like the link is broken or the page moved. If you were trying to open something inside your dashboard, use the buttons below to get back on track.
              </div>

              <div className="mt-4 text-xs text-gray-600 dark:text-gray-300 break-all">
                <span className="font-medium">Requested:</span> {pathname || '—'}
              </div>
            </div>

            <div className="shrink-0">
              <div className="rounded-lg border p-4 bg-[color:var(--color-primary)]/5">
                <div className="text-sm font-medium">Quick return</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  Go back, or jump to your main dashboard.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button variant="outline" onClick={handleBack}>
              Go back
            </Button>
            <ButtonLink href={mainDashboardHref} variant="primary">
              Main dashboard
            </ButtonLink>
          </div>
        </Card>

        <div className="mt-4 text-center text-xs text-gray-600 dark:text-gray-300">
          Tip: If this keeps happening, try refreshing or re-logging in.
        </div>
      </div>
    </div>
  )
}
