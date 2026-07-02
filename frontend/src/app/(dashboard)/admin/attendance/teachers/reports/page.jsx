"use client"

import AttendanceReportsView from '@/components/attendance/AttendanceReportsView'

export default function AttendanceReportsPage() {
  return (
    <AttendanceReportsView
      title="Teachers Attendance Reports"
      subtitle="Generate comprehensive teacher attendance reports with various filters and analysis."
      reportTypes={[{ value: 'teacher-search', label: 'Teacher Attendance' }]}
    />
  )
}
