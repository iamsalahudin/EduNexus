"use client"

import AttendanceReportsView from '@/components/attendance/AttendanceReportsView'

export default function AttendanceReportsPage() {
  return (
    <AttendanceReportsView
      title="Student Attendance Reports"
      subtitle="Generate comprehensive attendance reports with various filters and analysis."
      reportTypes={[
        // { value: 'class-wise', label: 'Class-wise Report' },
        { value: 'student-wise', label: 'Student-wise Report' },
        // { value: 'school-trends', label: 'School Trends' },
      ]}
    />
  )
}
