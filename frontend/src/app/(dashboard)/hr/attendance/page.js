"use client"

import { useEffect, useState } from 'react'
import { Card, PageHeader, Skeleton } from '@/components/ui'
import { fetchStaffAttendanceSummary } from '@/services/attendanceService'
import AttendanceActionCard from '@/components/attendance/AttendanceActionCard'
import AttendanceSummaryCard from '@/components/attendance/AttendanceSummaryCard'

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
            <AttendanceSummaryCard
              label="Teacher Total Days"
              value={staffSummary?.total ?? 0}
              sublabel="Teacher records in range"
            />
            <AttendanceSummaryCard
              label="Teacher Present"
              value={staffSummary?.present ?? 0}
              sublabel={`${staffPresenceRate}% present`}
              valueClassName="text-green-600"
            />
            <AttendanceSummaryCard
              label="Teacher Late"
              value={staffSummary?.late ?? 0}
              sublabel="Late entries"
              valueClassName="text-amber-600"
            />
            <AttendanceSummaryCard
              label="Absent + Leave"
              value={(staffSummary?.absent ?? 0) + (staffSummary?.leave ?? 0)}
              sublabel="Staff unavailable"
              valueClassName="text-red-600"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <AttendanceActionCard
          title="Daily Teacher Attendance"
          description="Monitor teacher attendance by date with role-specific filters."
          href="/hr/attendance/staff"
          buttonLabel="Open Teacher Attendance"
          icon="👨‍🏫"
          iconClassName="bg-blue-100"
        />

        <AttendanceActionCard
          title="Monthly & Yearly Downloads"
          description="Download teacher attendance summaries by month or year from reports."
          href="/hr/reports/attendance"
          buttonLabel="Open Reports"
          icon="⬇️"
          iconClassName="bg-green-100"
        />
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
