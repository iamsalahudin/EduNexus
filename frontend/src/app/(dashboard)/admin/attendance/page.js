"use client"

import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, Skeleton, StatCard } from '@/components/ui'
import { fetchStudentAttendanceSummary, fetchStaffAttendanceSummary } from '@/services/attendanceService'

export default function AttendanceHome() {
  const [studentSummary, setStudentSummary] = useState(null)
  const [staffSummary, setStaffSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [s1, s2] = await Promise.all([
          fetchStudentAttendanceSummary(),
          fetchStaffAttendanceSummary()
        ])
        if (!mounted) return
        setStudentSummary(s1.summary || [])
        setStaffSummary(s2.summary || null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const studentCount = Array.isArray(studentSummary) ? studentSummary.length : 0

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Student attendance and staff/teacher attendance."
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Student Summary (rows)" value={loading ? '...' : studentCount} />
        <StatCard label="Staff Total" value={loading ? '...' : (staffSummary?.total ?? 0)} />
        <StatCard label="Staff Present" value={loading ? '...' : (staffSummary?.present ?? 0)} />
        <StatCard label="Staff Absent" value={loading ? '...' : (staffSummary?.absent ?? 0)} />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <h3 className="font-medium">Student Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">View and mark student attendance (Admin has full access).</p>
          <div className="mt-4">
            <ButtonLink href="/admin/attendance/students" variant="secondary">Open</ButtonLink>
          </div>
        </Card>
        <Card>
          <h3 className="font-medium">Staff Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">View staff/teacher attendance records.</p>
          <div className="mt-4">
            <ButtonLink href="/admin/attendance/staff" variant="secondary">Open</ButtonLink>
          </div>
        </Card>
        <Card>
          <h3 className="font-medium">Attendance Setup</h3>
          <p className="text-sm text-gray-600 mt-1">Assign teacher class/section and link student logins to student records.</p>
          <div className="mt-4">
            <ButtonLink href="/admin/attendance/setup" variant="secondary">Open</ButtonLink>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="mt-6">
          <Skeleton className="h-24" />
        </div>
      ) : null}
    </div>
  )
}

