"use client"

import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, Skeleton, StatCard } from '@/components/ui'
import { fetchStudentAttendanceSummary, fetchStaffAttendanceSummary } from '@/services/attendanceService'

export default function AttendanceHome() {
  const [studentStats, setStudentStats] = useState(null)
  const [staffStats, setStaffStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [s1, s2] = await Promise.all([
          fetchStudentAttendanceSummary(),
          fetchStaffAttendanceSummary()
        ])
        if (!mounted) return
        // Convert summary data to aggregated stats
        const studentSummary = s1.summary || {}
        setStudentStats({
          total: studentSummary.total || 0,
          present: studentSummary.present || 0,
          absent: studentSummary.absent || 0,
          leave: studentSummary.leave || 0
        })
        setStaffStats(s2.summary || {
          total: 0,
          present: 0,
          absent: 0,
          leave: 0
        })
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

  const studentPresenceRate = studentStats?.total ? ((studentStats.present / studentStats.total) * 100).toFixed(1) : 0
  const staffPresenceRate = staffStats?.total ? ((staffStats.present / staffStats.total) * 100).toFixed(1) : 0

  return (
    <div>
      <PageHeader
        title="Attendance Management"
        subtitle="Monitor school-wide attendance for students and staff with comprehensive analytics."
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STUDENTS SECTION */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Students</h3>
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (
              <>
                <StatCard label="Total Students" value={studentStats?.total ?? 0} />
                <StatCard label="Present" value={studentStats?.present ?? 0} color="green" />
                <StatCard label="Absent" value={studentStats?.absent ?? 0} color="red" />
                <StatCard label="Leave" value={studentStats?.leave ?? 0} color="amber" />
              </>
            )}
          </div>
        </div>

        {/* STAFF/TEACHERS SECTION */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Staff & Teachers</h3>
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (
              <>
                <StatCard label="Total Staff" value={staffStats?.total ?? 0} />
                <StatCard label="Present" value={staffStats?.present ?? 0} color="green" />
                <StatCard label="Absent" value={staffStats?.absent ?? 0} color="red" />
                <StatCard label="Leave" value={staffStats?.leave ?? 0} color="amber" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ATTENDANCE DISTRIBUTION CHARTS */}
      <Card className="mt-6">
        <h3 className="font-semibold mb-6">Attendance Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Student Attendance</h4>
            {loading ? (
              <Skeleton className="h-40" />
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Present</span>
                    <span className="font-semibold text-green-600">{studentStats?.present ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${studentPresenceRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{studentPresenceRate}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Absent</span>
                    <span className="font-semibold text-red-600">{studentStats?.absent ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${studentStats?.total ? ((studentStats.absent / studentStats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{studentStats?.total ? ((studentStats.absent / studentStats.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Leave</span>
                    <span className="font-semibold text-amber-600">{studentStats?.leave ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full"
                        style={{ width: `${studentStats?.total ? ((studentStats.leave / studentStats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{studentStats?.total ? ((studentStats.leave / studentStats.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Staff Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Staff Attendance</h4>
            {loading ? (
              <Skeleton className="h-40" />
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Present</span>
                    <span className="font-semibold text-green-600">{staffStats?.present ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${staffPresenceRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{staffPresenceRate}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Absent</span>
                    <span className="font-semibold text-red-600">{staffStats?.absent ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${staffStats?.total ? ((staffStats.absent / staffStats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{staffStats?.total ? ((staffStats.absent / staffStats.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Leave</span>
                    <span className="font-semibold text-amber-600">{staffStats?.leave ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full"
                        style={{ width: `${staffStats?.total ? ((staffStats.leave / staffStats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{staffStats?.total ? ((staffStats.leave / staffStats.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* NAVIGATION CARDS */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Daily Attendance</h4>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Mark and view student attendance for a specific date.</p>
          <ButtonLink href="/admin/attendance/daily" variant="primary" className="w-full">
            View Daily
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Class-wise Attendance</h4>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">View attendance statistics by class and section.</p>
          <ButtonLink href="/admin/attendance/class" variant="primary" className="w-full">
            View Classes
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Teacher Attendance</h4>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Mark and update teacher attendance by day-wise or teacher-wise selection.</p>
          <ButtonLink href="/admin/attendance/teachers" variant="primary" className="w-full">
            Manage Teachers
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Reports</h4>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Open student and teacher attendance reports.</p>
          <ButtonLink href="/admin/attendance/teachers/reports" variant="primary" className="w-full">
            Open Reports
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Quick Mark</h4>
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Update student attendance from daily class sections.</p>
          <ButtonLink href="/admin/attendance/daily" variant="primary" className="w-full">
            Mark Now
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Setup</h4>
            <span className="text-2xl">⚙️</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Configure teachers, sections, and attendance rules.</p>
          <ButtonLink href="/admin/attendance/setup" variant="primary" className="w-full">
            Configure
          </ButtonLink>
        </Card>
      </div>
    </div>
  )
}

