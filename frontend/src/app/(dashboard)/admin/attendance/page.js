"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Skeleton from '@/components/ui/Skeleton'
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
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <p className="text-sm text-gray-600 mt-1">Student attendance and staff/teacher attendance.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600">Student Summary (rows)</div>
          <div className="text-2xl font-semibold mt-1">{loading ? '...' : studentCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Staff Total</div>
          <div className="text-2xl font-semibold mt-1">{loading ? '...' : (staffSummary?.total ?? 0)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Staff Present</div>
          <div className="text-2xl font-semibold mt-1">{loading ? '...' : (staffSummary?.present ?? 0)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Staff Absent</div>
          <div className="text-2xl font-semibold mt-1">{loading ? '...' : (staffSummary?.absent ?? 0)}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-medium">Student Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">View and mark student attendance (Admin has full access).</p>
          <div className="mt-4">
            <Link href="/admin/attendance/students" className="px-3 py-2 border rounded hover-theme-primary">Open</Link>
          </div>
        </div>
        <div className="card">
          <h3 className="font-medium">Staff Attendance</h3>
          <p className="text-sm text-gray-600 mt-1">View staff/teacher attendance records.</p>
          <div className="mt-4">
            <Link href="/admin/attendance/staff" className="px-3 py-2 border rounded hover-theme-primary">Open</Link>
          </div>
        </div>
        <div className="card">
          <h3 className="font-medium">Attendance Setup</h3>
          <p className="text-sm text-gray-600 mt-1">Assign teacher class/section and link student logins to student records.</p>
          <div className="mt-4">
            <Link href="/admin/attendance/setup" className="px-3 py-2 border rounded hover-theme-primary">Open</Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6">
          <Skeleton className="h-24" />
        </div>
      ) : null}
    </div>
  )
}
