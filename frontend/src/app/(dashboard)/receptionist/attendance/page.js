"use client"

import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import { fetchStaffAttendanceSummary } from '@/services/attendanceService'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function ReceptionistAttendanceHub() {
  const today = toInputDate(new Date())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchStaffAttendanceSummary({
          role: 'Teacher',
          fromDate: today,
          toDate: today
        })
        if (!mounted) return
        setSummary(res.summary || null)
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.error || e.message || 'Failed to load teacher attendance')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [today])

  const totalCount = Number(summary?.total || 0)
  const presentCount = Number(summary?.present || 0)
  const absentCount = Number(summary?.absent || 0) + Number(summary?.leave || 0)
  const attendancePercentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0

  return (
    <div>
      <PageHeader
        title="Teacher Attendance"
        subtitle="Mark daily teacher attendance and review monthly/yearly summaries."
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <div className="card">
              <div className="text-sm text-gray-500">Teacher Records</div>
              <div className="mt-2 text-2xl font-semibold">{totalCount}</div>
              <div className="mt-1 text-xs text-gray-500">daily teacher entries</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Present</div>
              <div className="mt-2 text-2xl font-semibold text-green-600">{presentCount}</div>
              <div className="mt-1 text-xs text-gray-500">{attendancePercentage}% attendance rate</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Absent/Leave</div>
              <div className="mt-2 text-2xl font-semibold text-red-600">{absentCount}</div>
              <div className="mt-1 text-xs text-gray-500">not available today</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Mark Daily Attendance</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📋</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Use day-wise mode to mark teacher attendance and teacher-wise mode to review date ranges.
          </p>
          <ButtonLink href="/receptionist/attendance/teachers" variant="primary" className="w-full">
            Open Teacher Attendance
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Monthly/Yearly Summaries</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">✓</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Download filtered monthly and yearly teacher attendance summaries from the management page.
          </p>
          {loading ? (
            <Skeleton className="h-10" />
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-green-50 rounded border border-green-200 text-center">
                <div className="text-xs text-green-600">Present</div>
                <div className="text-xl font-bold text-green-700">{presentCount}</div>
              </div>
              <div className="flex-1 p-3 bg-red-50 rounded border border-red-200 text-center">
                <div className="text-xs text-red-600">Absent/Leave</div>
                <div className="text-xl font-bold text-red-700">{absentCount}</div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="font-semibold mb-3">Reception Guide</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex gap-2">
            <span className="font-semibold text-gray-900">•</span>
            <span>Use teacher attendance page to mark daily status for all teachers.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-900">•</span>
            <span>Switch to teacher-wise mode for monthly and yearly summaries.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-900">•</span>
            <span>Use CSV export to download attendance summaries by your selected range.</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-900">•</span>
            <span>Use date filters only for current and previous dates to avoid invalid entries.</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
