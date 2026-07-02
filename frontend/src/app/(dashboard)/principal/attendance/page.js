"use client"

import { useEffect, useState } from 'react'
import { Card, PageHeader, Skeleton, StatCard } from '@/components/ui'
import { fetchStudentAttendanceSummary, fetchStaffAttendanceSummary } from '@/services/attendanceService'
import AttendanceActionCard from '@/components/attendance/AttendanceActionCard'

export default function AttendanceHome() {
  const [studentStats, setStudentStats] = useState(null)
  const [staffStats, setStaffStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      const today = new Date().toISOString().slice(0, 10)
      setLoading(true)
      setError(null)
      try {
        const [s1, s2] = await Promise.all([
          fetchStudentAttendanceSummary({ fromDate: today, toDate: today }),
          fetchStaffAttendanceSummary({ fromDate: today, toDate: today })
        ])
        if (!mounted) return
        // Convert summary data to aggregated stats
        const studentTotals = s1.totals || {}
        setStudentStats({
          total: studentTotals.totalDays || 0,
          present: studentTotals.presentDays || 0,
          absent: studentTotals.absentDays || 0,
          late: studentTotals.lateDays || 0,
          leave: studentTotals.excusedDays || 0,
          notMarkedYet: Math.max(0, (studentTotals.totalDays || 0) - ((studentTotals.presentDays || 0) + (studentTotals.absentDays || 0) + (studentTotals.lateDays || 0) + (studentTotals.excusedDays || 0)))
        })
        const staffTotals = s2.totals || {}
        setStaffStats({
          total: staffTotals.totalDays || 0,
          present: staffTotals.presentDays || 0,
          absent: staffTotals.absentDays || 0,
          late: staffTotals.lateDays || 0,
          leave: staffTotals.excusedDays || 0,
          notMarkedYet: Math.max(0, (staffTotals.totalDays || 0) - ((staffTotals.presentDays || 0) + (staffTotals.absentDays || 0) + (staffTotals.lateDays || 0) + (staffTotals.excusedDays || 0)))
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
          <div className="grid grid-cols-3 gap-3">
            {loading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (
              <>
                <StatCard label="Total Records" value={studentStats?.total ?? 0} />
                <StatCard label="Present" value={studentStats?.present ?? 0} color="green" />
                <StatCard label="Absent" value={studentStats?.absent ?? 0} color="red" />
                <StatCard label="Late" value={studentStats?.late ?? 0} color="orange" />
                <StatCard label="Leave" value={studentStats?.leave ?? 0} color="amber" />
                <StatCard label="Not Marked Yet" value={studentStats?.notMarkedYet ?? 0} color="gray" />
              </>
            )}
          </div>
        </div>

        {/* STAFF/TEACHERS SECTION */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Staff & Teachers</h3>
          <div className="grid grid-cols-3 gap-3">
            {loading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (
              <>
                <StatCard label="Total Records" value={staffStats?.total ?? 0} />
                <StatCard label="Present" value={staffStats?.present ?? 0} color="green" />
                <StatCard label="Absent" value={staffStats?.absent ?? 0} color="red" />
                <StatCard label="Late" value={staffStats?.late ?? 0} color="orange" />
                <StatCard label="Leave" value={staffStats?.leave ?? 0} color="amber" />
                <StatCard label="Not Marked Yet" value={staffStats?.notMarkedYet ?? 0} color="gray" />
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
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Late</span>
                    <span className="font-semibold text-orange-600">{studentStats?.late ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${studentStats?.total ? ((studentStats.late / studentStats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{studentStats?.total ? ((studentStats.late / studentStats.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Not Marked Yet</span>
                    <span className="font-semibold text-gray-600">{studentStats?.notMarkedYet ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full"
                        style={{ width: `${studentStats?.total ? ((studentStats.notMarkedYet / studentStats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{studentStats?.total ? ((studentStats.notMarkedYet / studentStats.total) * 100).toFixed(1) : 0}%</span>
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
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Late</span>
                    <span className="font-semibold text-orange-600">{staffStats?.late ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${staffStats?.total ? ((staffStats.late / staffStats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{staffStats?.total ? ((staffStats.late / staffStats.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Not Marked Yet</span>
                    <span className="font-semibold text-gray-600">{staffStats?.notMarkedYet ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-400 h-2 rounded-full"
                        style={{ width: `${staffStats?.total ? ((staffStats.notMarkedYet / staffStats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{staffStats?.total ? ((staffStats.notMarkedYet / staffStats.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* NAVIGATION CARDS */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <AttendanceActionCard
          title="Daily Attendance"
          description="Mark and view student attendance for a specific date."
          href="/principal/attendance/daily"
          buttonLabel="View Daily"
          icon="📅"
          iconClassName="bg-blue-100"
        />

        <AttendanceActionCard
          title="Class-wise Attendance"
          description="View attendance statistics by class and section."
          href="/principal/attendance/class"
          buttonLabel="View Classes"
          icon="📊"
          iconClassName="bg-emerald-100"
        />

        <AttendanceActionCard
          title="Teacher Attendance"
          description="Mark and update teacher attendance by day-wise or teacher-wise selection."
          href="/principal/attendance/teachers"
          buttonLabel="Manage Teachers"
          icon="👥"
          iconClassName="bg-amber-100"
        />

        <AttendanceActionCard
          title="Reports"
          description="Open student and teacher attendance reports."
          href="/principal/attendance/teachers/reports"
          buttonLabel="Open Reports"
          icon="📈"
          iconClassName="bg-indigo-100"
        />

        <AttendanceActionCard
          title="Quick Mark"
          description="Update student attendance from daily class sections."
          href="/principal/attendance/daily"
          buttonLabel="Mark Now"
          icon="✓"
          iconClassName="bg-green-100"
        />

        <AttendanceActionCard
          title="Setup"
          description="Configure teachers, sections, and attendance rules."
          href="/principal/attendance/setup"
          buttonLabel="Configure"
          icon="⚙️"
          iconClassName="bg-gray-100"
        />
      </div>
    </div>
  )
}

