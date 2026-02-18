"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <p className="text-sm text-gray-600 mt-1">View student attendance summaries and details.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">Student Summary (rows)<br/>{loading ? '...' : studentCount}</div>
        <div className="card">
          <div className="font-medium">Student Attendance</div>
          <div className="text-sm text-gray-600 mt-1">View attendance records by class/date range.</div>
          <div className="mt-4">
            <Link href="/reception/attendance/students" className="px-3 py-2 border rounded hover-theme-primary">Open</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

