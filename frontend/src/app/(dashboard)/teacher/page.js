"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonLink, Card, PageHeader, Skeleton, StatCard } from '@/components/ui'
import { fetchStaffAttendanceSummary } from '@/services/attendanceService'
import timetableService from '@/services/timetableService'

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const QUICK_ACTIONS = [
  { href: '/teacher/attendance', label: 'Attendance', description: 'Mark or review daily attendance.' },
  { href: '/teacher/timetable', label: 'Timetable', description: 'Open your personal teaching schedule.' },
  { href: '/teacher/homework', label: 'Homework', description: 'Track assigned work and submissions.' },
  { href: '/teacher/exams/marks-management', label: 'Marks Management', description: 'Enter marks for assigned classes.' },
  { href: '/teacher/students', label: 'Students', description: 'Browse your class rosters and profiles.' },
]

export default function TeacherDashboard() {
  const [bootstrapping, setBootstrapping] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [attendanceSummary, setAttendanceSummary] = useState(null)
  const [timetables, setTimetables] = useState([])
  const [error, setError] = useState('')

  async function loadDashboard({ silent = false } = {}) {
    if (silent) {
      setRefreshing(true)
    } else {
      setBootstrapping(true)
    }

    setError('')

    const [attendanceResult, timetableResult] = await Promise.allSettled([
      fetchStaffAttendanceSummary({ role: 'Teacher', period: 'month' }),
      timetableService.listTeacherPersonalTimetables(),
    ])

    if (attendanceResult.status === 'fulfilled') {
      setAttendanceSummary(attendanceResult.value)
    } else {
      setAttendanceSummary(null)
    }

    if (timetableResult.status === 'fulfilled') {
      setTimetables(Array.isArray(timetableResult.value?.timetables) ? timetableResult.value.timetables : [])
    } else {
      setTimetables([])
    }

    const attendanceError = attendanceResult.status === 'rejected' ? attendanceResult.reason?.response?.data?.error : ''
    const timetableError = timetableResult.status === 'rejected' ? timetableResult.reason?.response?.data?.error : ''
    const message = [attendanceError, timetableError].filter(Boolean).join(' | ')
    setError(message || '')

    if (silent) {
      setRefreshing(false)
    } else {
      setBootstrapping(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const attendance = attendanceSummary?.summary || {}
  const selectedTimetable = timetables[0] || null

  const stats = useMemo(() => {
    const total = toNumber(attendance.total)
    const present = toNumber(attendance.present)

    return {
      total,
      present,
      absent: toNumber(attendance.absent),
      late: toNumber(attendance.late),
      leave: toNumber(attendance.leave),
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      timetables: timetables.length,
    }
  }, [attendance, timetables.length])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Dashboard"
        subtitle="Your workspace for attendance, timetable, homework, marks, and class updates."
        right={(
          <Button type="button" onClick={() => loadDashboard({ silent: true })} disabled={bootstrapping || refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Attendance Days" value={bootstrapping ? '...' : stats.total} />
        <StatCard label="Present" value={bootstrapping ? '...' : stats.present} />
        <StatCard label="Late" value={bootstrapping ? '...' : stats.late} />
        <StatCard label="Leave" value={bootstrapping ? '...' : stats.leave} />
        <StatCard label="Attendance Rate" value={bootstrapping ? '...' : `${stats.attendanceRate}%`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg">Quick Actions</h2>
              <p className="text-sm text-gray-600 mt-1">
                Jump straight to the teacher tools you use most.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <ButtonLink key={action.href} href={action.href} variant="outline" className="text-left justify-start h-auto py-3 px-4">
                <div>
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                </div>
              </ButtonLink>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-lg">This Month</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Timetables linked</span>
              <span className="font-medium">{bootstrapping ? '...' : stats.timetables}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Present rate</span>
              <span className="font-medium">{bootstrapping ? '...' : `${stats.attendanceRate}%`}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Finance access</span>
              <span className="font-medium text-gray-900">Restricted</span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <ButtonLink href="/teacher/attendance" variant="primary" className="w-full">Open Attendance</ButtonLink>
            <ButtonLink href="/teacher/timetable" variant="outline" className="w-full">Open Timetable</ButtonLink>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">Personal Timetable</h2>
            <p className="text-sm text-gray-600 mt-1">
              A quick snapshot of the timetable assigned to your account.
            </p>
          </div>
          <ButtonLink href="/teacher/timetable" variant="outline">View full timetable</ButtonLink>
        </div>

        <div className="mt-4">
          {bootstrapping ? (
            <Skeleton className="h-28" />
          ) : selectedTimetable ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="font-medium text-gray-900">
                {selectedTimetable.name || selectedTimetable.title || selectedTimetable.label || 'Personal timetable'}
              </div>
              <div className="mt-2">
                {Array.isArray(selectedTimetable.slots)
                  ? `${selectedTimetable.slots.length} scheduled slots available in this timetable.`
                  : 'Timetable details are available in the dedicated timetable page.'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              No linked timetable found yet. Use the timetable page to review assignments.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
