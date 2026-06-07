"use client"

import AttendanceReportsView from '@/components/attendance/AttendanceReportsView'

export default function AttendanceReportsPage() {
  return (
    <AttendanceReportsView
      title="Attendance Reports"
      subtitle="Employee attendance reports and analytics"
      backHref="/hr/employees/attendance"
    />
  )
}
