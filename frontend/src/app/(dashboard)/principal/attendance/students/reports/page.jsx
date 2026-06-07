"use client"

import AttendanceReportsView from '@/components/attendance/AttendanceReportsView'

export default function AttendanceReportsPage() {
  return (
    <AttendanceReportsView
      title="Student Attendance Reports"
      subtitle="Generate comprehensive attendance reports with various filters and analysis."
      backHref="/principal/attendance"
    />
  )
}
