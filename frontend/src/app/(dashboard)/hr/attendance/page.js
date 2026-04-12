"use client"

import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, Skeleton } from '@/components/ui'
import { fetchStaffAttendanceSummary } from '@/services/attendanceService'

export default function HRAttendanceHub() {
  const [staffSummary, setStaffSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [s2] = await Promise.all([
          fetchStaffAttendanceSummary({ role: 'Teacher', period: 'month' })
        ])
        if (!mounted) return
        setStaffSummary(s2.summary || null)
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.error || e.message || 'Failed to load attendance data')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const staffPresenceRate = staffSummary?.total ? ((staffSummary.present / staffSummary.total) * 100).toFixed(1) : 0

  return (
    <div>
      <PageHeader
        title="Teacher Attendance Management"
        subtitle="View daily teacher attendance and download monthly/yearly summaries."
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <div className="card">
              <div className="text-sm text-gray-500">Teacher Total Days</div>
              <div className="mt-2 text-2xl font-semibold">{staffSummary?.total ?? 0}</div>
              <div className="mt-1 text-xs text-gray-500">Teacher records in range</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Teacher Present</div>
              <div className="mt-2 text-2xl font-semibold text-green-600">{staffSummary?.present ?? 0}</div>
              <div className="mt-1 text-xs text-gray-500">{staffPresenceRate}% present</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Teacher Late</div>
              <div className="mt-2 text-2xl font-semibold text-amber-600">{staffSummary?.late ?? 0}</div>
              <div className="mt-1 text-xs text-gray-500">Late entries</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Absent + Leave</div>
              <div className="mt-2 text-2xl font-semibold text-red-600">
                {(staffSummary?.absent ?? 0) + (staffSummary?.leave ?? 0)}
              </div>
              <div className="mt-1 text-xs text-gray-500">Staff unavailable</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Daily Teacher Attendance</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">👨‍🏫</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Monitor teacher attendance by date with role-specific filters.
          </p>
          <ButtonLink href="/hr/attendance/staff" variant="primary" className="w-full">
            Open Teacher Attendance
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Monthly & Yearly Downloads</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">⬇️</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Download teacher attendance summaries by month or year from reports.
          </p>
          <ButtonLink href="/hr/reports/attendance" variant="primary" className="w-full">
            Open Reports
          </ButtonLink>
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Attendance Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Staff Presence Trend</h4>
            {loading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Present</span>
                    <span className="font-semibold text-green-600">{staffSummary?.present ?? 0}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${staffPresenceRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Absent</span>
                    <span className="font-semibold text-red-600">{staffSummary?.absent ?? 0}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${staffSummary?.total ? ((staffSummary.absent / staffSummary.total) * 100) : 0}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Leave</span>
                    <span className="font-semibold text-amber-600">{staffSummary?.leave ?? 0}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full"
                      style={{
                        width: `${staffSummary?.total ? ((staffSummary.leave / staffSummary.total) * 100) : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h4>
            {loading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="font-medium text-green-900">Overall Presence Rate</div>
                  <div className="text-xs text-green-700 mt-1">{staffPresenceRate}% of staff present</div>
                </div>
                <div className="p-3 bg-amber-50 rounded border border-amber-200">
                  <div className="font-medium text-amber-900">Leave Requests</div>
                  <div className="text-xs text-amber-700 mt-1">{staffSummary?.leave ?? 0} staff on leave</div>
                </div>
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <div className="font-medium text-red-900">Absent Today</div>
                  <div className="text-xs text-red-700 mt-1">{staffSummary?.absent ?? 0} staff absent</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
