"use client"

import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, StatCard } from '@/components/ui'
import { fetchStudentAttendanceSummary, fetchStaffAttendanceSummary } from '@/services/attendanceService'

export default function Page() {
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
      <PageHeader title="Attendance" subtitle="Student attendance + your own attendance." />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Student Summary (rows)" value={loading ? '...' : studentCount} />
        <StatCard label="My Total" value={loading ? '...' : (staffSummary?.total ?? 0)} />
        <StatCard label="My Present" value={loading ? '...' : (staffSummary?.present ?? 0)} />
        <StatCard label="My Absent" value={loading ? '...' : (staffSummary?.absent ?? 0)} />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-medium">Student Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">Mark attendance for your class.</p>
          <div className="mt-4">
            <ButtonLink href="/teacher/student-attendance" variant="secondary">Open</ButtonLink>
          </div>
        </Card>
        <Card>
          <h3 className="font-medium">My Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">Mark your own staff attendance.</p>
          <div className="mt-4">
            <ButtonLink href="/teacher/attendance/my" variant="secondary">Open</ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  )
}

