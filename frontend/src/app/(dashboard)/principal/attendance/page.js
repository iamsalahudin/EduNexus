"use client"

import { useEffect, useMemo, useState } from 'react'
import { ButtonLink, Card, PageHeader, StatCard, Skeleton } from '@/components/ui'
import { fetchStudentAttendanceSummary, fetchStaffAttendance } from '@/services/attendanceService'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function summarizeByStatus(records = []) {
  const total = records.length
  let present = 0
  let absent = 0
  let leave = 0

  for (const record of records) {
    const status = String(record?.status || '').toLowerCase()
    if (status === 'present') present += 1
    else if (status === 'leave' || status === 'excused') leave += 1
    else absent += 1
  }

  return { total, present, absent, leave }
}

export default function PrincipalAttendanceDashboard() {
  const [studentSummary, setStudentSummary] = useState({ total: 0, present: 0, absent: 0, leave: 0 })
  const [teacherSummary, setTeacherSummary] = useState({ total: 0, present: 0, absent: 0, leave: 0 })
  const [staffSummary, setStaffSummary] = useState({ total: 0, present: 0, absent: 0, leave: 0 })
  const [trendRows, setTrendRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const today = new Date()
        const todayKey = toInputDate(today)

        const [studentRes, staffTodayRes] = await Promise.all([
          fetchStudentAttendanceSummary({ fromDate: todayKey, toDate: todayKey }),
          fetchStaffAttendance({ date: todayKey })
        ])

        if (!mounted) return

        const studentStats = studentRes?.summary || {}
        setStudentSummary({
          total: studentStats.total || 0,
          present: studentStats.present || 0,
          absent: (studentStats.absent || 0) + (studentStats.late || 0),
          leave: (studentStats.leave || 0) + (studentStats.excused || 0)
        })

        const allStaffRecords = staffTodayRes?.records || []
        const teacherRecords = allStaffRecords.filter((record) => /teacher/i.test(String(record?.user?.role || '')))
        const nonTeachingRecords = allStaffRecords.filter((record) => !/teacher/i.test(String(record?.user?.role || '')))

        setTeacherSummary(summarizeByStatus(teacherRecords))
        setStaffSummary(summarizeByStatus(nonTeachingRecords))

        const dates = Array.from({ length: 7 }).map((_, idx) => {
          const d = new Date(today)
          d.setDate(today.getDate() - (6 - idx))
          return toInputDate(d)
        })

        const trendData = await Promise.all(
          dates.map(async (dateStr) => {
            const [dayStudentRes, dayStaffRes] = await Promise.all([
              fetchStudentAttendanceSummary({ fromDate: dateStr, toDate: dateStr }),
              fetchStaffAttendance({ date: dateStr })
            ])
            const dayStudent = dayStudentRes?.summary || {}
            const dayStaffRecords = dayStaffRes?.records || []
            const dayStaffPresent = dayStaffRecords.filter((r) => String(r.status).toLowerCase() === 'present').length

            return {
              date: dateStr,
              studentsPresent: dayStudent.present || 0,
              studentsTotal: dayStudent.total || 0,
              staffPresent: dayStaffPresent,
              staffTotal: dayStaffRecords.length,
            }
          })
        )

        if (!mounted) return
        setTrendRows(trendData)
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

  const studentPresenceRate = studentSummary.total ? ((studentSummary.present / studentSummary.total) * 100).toFixed(1) : '0.0'
  const teacherPresenceRate = teacherSummary.total ? ((teacherSummary.present / teacherSummary.total) * 100).toFixed(1) : '0.0'
  const staffPresenceRate = staffSummary.total ? ((staffSummary.present / staffSummary.total) * 100).toFixed(1) : '0.0'

  const maxStudentPresent = useMemo(() => {
    const max = trendRows.reduce((acc, row) => Math.max(acc, row.studentsPresent || 0), 0)
    return max || 1
  }, [trendRows])

  return (
    <div>
      <PageHeader
        title="School Attendance Overview"
        subtitle="Monitor and manage attendance across students, teachers, and staff."
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
            <StatCard label="Students" value={`${studentSummary.present}/${studentSummary.total}`} />
            <StatCard label="Teachers" value={`${teacherSummary.present}/${teacherSummary.total}`} />
            <StatCard label="Staff" value={`${staffSummary.present}/${staffSummary.total}`} />
            <StatCard label="Today Presence" value={`${Math.round((Number(studentPresenceRate) + Number(teacherPresenceRate) + Number(staffPresenceRate)) / 3)}%`} />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Student Attendance</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📚</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            View class/section/date based student status and trends.
          </p>
          <ButtonLink href="/principal/attendance/students" variant="primary" className="w-full">
            View Student Attendance
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Teacher Attendance</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">👨‍🏫</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Monitor teacher attendance by date and department.
          </p>
          <ButtonLink href="/principal/attendance/teachers" variant="primary" className="w-full">
            View Teacher Attendance
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Staff Attendance</h3>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏢</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            View and manage non-teaching staff attendance by department.
          </p>
          <ButtonLink href="/principal/attendance/staff" variant="primary" className="w-full">
            View Staff Attendance
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Setup</h3>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">⚙️</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Assign teachers to class-section pairs for attendance control.
          </p>
          <ButtonLink href="/principal/attendance/setup" variant="primary" className="w-full">
            Open Setup
          </ButtonLink>
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Attendance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Students</h4>
            {loading ? (
              <Skeleton className="h-32" />
            ) : (
              <div>
                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{studentPresenceRate}%</div>
                    <div className="text-xs text-gray-500">Presence rate</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Present</span>
                      <span className="font-semibold">{studentSummary.present}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${studentPresenceRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Absent</span>
                      <span className="font-semibold">
                        {studentSummary.absent}
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${studentSummary.total ? ((studentSummary.absent / studentSummary.total) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Leave</span>
                      <span className="font-semibold">{studentSummary.leave}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{
                          width: `${studentSummary.total ? ((studentSummary.leave / studentSummary.total) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Teachers</h4>
            {loading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="space-y-3">
                <div className="text-3xl font-bold text-green-600">{teacherPresenceRate}%</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Present</span>
                    <span className="font-semibold text-green-700">{teacherSummary.present}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Absent</span>
                    <span className="font-semibold text-red-700">{teacherSummary.absent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Leave</span>
                    <span className="font-semibold text-amber-700">{teacherSummary.leave}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Staff</h4>
            {loading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="space-y-3">
                <div className="text-3xl font-bold text-purple-600">{staffPresenceRate}%</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Present</span>
                    <span className="font-semibold text-green-700">{staffSummary.present}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Absent</span>
                    <span className="font-semibold text-red-700">{staffSummary.absent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Leave</span>
                    <span className="font-semibold text-amber-700">{staffSummary.leave}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">7-Day Attendance Trend</h3>
        {loading ? (
          <Skeleton className="h-36" />
        ) : trendRows.length === 0 ? (
          <p className="text-sm text-gray-600">No trend data available.</p>
        ) : (
          <div className="space-y-3">
            {trendRows.map((row) => (
              <div key={row.date} className="grid grid-cols-[90px_1fr_60px] items-center gap-3">
                <span className="text-xs text-gray-500">{row.date.slice(5)}</span>
                <div className="h-3 bg-gray-200 rounded-full">
                  <div
                    className="h-3 bg-indigo-600 rounded-full"
                    style={{ width: `${Math.round((row.studentsPresent / maxStudentPresent) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">{row.studentsPresent}</span>
              </div>
            ))}
            <p className="text-xs text-gray-500">Bars represent daily students present count from backend attendance data.</p>
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg mb-2">Reports</h3>
          <p className="text-sm text-gray-600 mb-4">View and download school attendance reports by filters.</p>
          <ButtonLink href="/principal/attendance/reports" variant="secondary" className="w-full">
            Open Reports
          </ButtonLink>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg mb-2">Management</h3>
          <p className="text-sm text-gray-600 mb-4">Principal can manage setup, updates, and attendance reports from one place.</p>
          <ButtonLink href="/principal/attendance/setup" variant="secondary" className="w-full">
            Open Setup
          </ButtonLink>
        </Card>
      </div>
    </div>
  )
}


