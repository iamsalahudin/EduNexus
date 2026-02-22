"use client"

import { useEffect, useState } from 'react'
import { ButtonLink, Card, PageHeader, StatCard } from '@/components/ui'
import { fetchStudentAttendanceSummary } from '@/services/attendanceService'

export default function Page() {
  const [studentSummary, setStudentSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const s1 = await fetchStudentAttendanceSummary()
        if (!mounted) return
        setStudentSummary(s1.summary || [])
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
      <PageHeader title="Attendance" subtitle="View student attendance summaries and details." />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Student Summary (rows)" value={loading ? '...' : studentCount} />
        <Card>
          <div className="font-medium">Student Attendance</div>
          <div className="text-sm text-gray-600 mt-1">View attendance records by class/date range.</div>
          <div className="mt-4">
            <ButtonLink href="/reception/attendance/students" variant="secondary">Open</ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  )
}


