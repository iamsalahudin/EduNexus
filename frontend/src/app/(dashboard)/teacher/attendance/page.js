"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <p className="text-sm text-gray-600 mt-1">Student attendance + your own attendance.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">Student Summary (rows)<br/>{loading ? '...' : studentCount}</div>
        <div className="card">My Total<br/>{loading ? '...' : (staffSummary?.total ?? 0)}</div>
        <div className="card">My Present<br/>{loading ? '...' : (staffSummary?.present ?? 0)}</div>
        <div className="card">My Absent<br/>{loading ? '...' : (staffSummary?.absent ?? 0)}</div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-medium">Student Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">Mark attendance for your class.</p>
          <div className="mt-4">
            <Link href="/teacher/student-attendance" className="px-3 py-2 border rounded hover-theme-primary">Open</Link>
          </div>
        </div>
        <div className="card">
          <h3 className="font-medium">My Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">Mark your own staff attendance.</p>
          <div className="mt-4">
            <Link href="/teacher/attendance/my" className="px-3 py-2 border rounded hover-theme-primary">Open</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
