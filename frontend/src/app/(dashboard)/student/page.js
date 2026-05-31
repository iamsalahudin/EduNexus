"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import authService from '@/services/auth.service'
import { ButtonLink, Card, EmptyState, PageHeader, Skeleton, StatCard } from '@/components/ui'

const QUICK_ACTIONS = [
  { href: '/student/attendance', title: 'Attendance', description: 'Review daily presence and monthly history.' },
  { href: '/student/complaints', title: 'Complaints', description: 'Submit and track your school complaints.' },
  { href: '/student/homework', title: 'Homework', description: 'See assigned work and submit your tasks.' },
  { href: '/student/results', title: 'Results', description: 'Review published results and report cards.' },
  { href: '/student/notifications', title: 'Notifications', description: 'Read personal, class, and school updates.' },
  { href: '/student/settings', title: 'Settings', description: 'Update profile details and password.' }
]

function scopeValue(value) {
  const normalized = String(value || '').trim()
  return normalized || '—'
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    let active = true

    async function loadUser() {
      try {
        setLoading(true)
        setError('')
        const res = await authService.me()
        if (!active) return
        setUser(res?.user || null)
      } catch (err) {
        if (!active) return
        setError(err?.response?.data?.error || err?.message || 'Failed to load your dashboard')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [])

  const studentName = useMemo(() => {
    const name = user?.name || user?.fullName || user?.username || ''
    return name || 'Student'
  }, [user])

  const profileCards = useMemo(() => ([
    { label: 'Class', value: scopeValue(user?.class || user?.profile?.class || user?.profile?.className) },
    { label: 'Section', value: scopeValue(user?.section || user?.profile?.section) },
    { label: 'Roll No.', value: scopeValue(user?.rollNumber || user?.profile?.rollNumber) },
    { label: 'Admission No.', value: scopeValue(user?.admissionNumber || user?.profile?.admissionNumber) }
  ]), [user])

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${studentName}`}
        subtitle="Your student dashboard, scoped to your class and profile."
        right={<ButtonLink href="/student/settings/profile" variant="outline">View Profile</ButtonLink>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          profileCards.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {QUICK_ACTIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card group border border-gray-200 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
          >
            <div className="text-base font-semibold text-gray-900 group-hover:text-black">{item.title}</div>
            <div className="mt-2 text-sm text-gray-600">{item.description}</div>
          </Link>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Student profile snapshot</h2>
            <p className="mt-1 text-sm text-gray-600">
              This hub only surfaces your own student account context and entry points.
            </p>
          </div>
          <ButtonLink href="/student/timetable" variant="outline">Open Timetable</ButtonLink>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : user ? (
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-gray-500">Username</div>
              <div className="mt-1 font-medium text-gray-900">{scopeValue(user?.username)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-gray-500">Email</div>
              <div className="mt-1 font-medium text-gray-900">{scopeValue(user?.email)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-gray-500">Role</div>
              <div className="mt-1 font-medium text-gray-900">{scopeValue(user?.role)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-gray-500">Transport</div>
              <div className="mt-1 font-medium text-gray-900">
                {user?.profile?.availTransport || user?.availTransport ? 'Enrolled' : 'Not enrolled'}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="Student profile unavailable"
              description="We could not load your account context right now."
            />
          </div>
        )}
      </Card>
    </div>
  )
}
