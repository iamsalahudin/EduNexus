"use client"

import { useEffect, useState } from 'react'
import { ButtonLink, PageHeader, StatCard } from '@/components/ui'
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
      <PageHeader title="Attendance" subtitle="View attendance summaries and details." />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Student Summary (rows)" value={loading ? '...' : studentCount} />
        <StatCard label="Staff Total" value={loading ? '...' : (staffSummary?.total ?? 0)} />
        <StatCard label="Staff Present" value={loading ? '...' : (staffSummary?.present ?? 0)} />
        <StatCard label="Staff Absent" value={loading ? '...' : (staffSummary?.absent ?? 0)} />
      </div>

      <div className="mt-6 flex gap-3">
        <ButtonLink href="/hr/attendance/students" variant="secondary">Student Attendance</ButtonLink>
        <ButtonLink href="/hr/attendance/staff" variant="secondary">Staff Attendance</ButtonLink>
      </div>
    </div>
  )
}


