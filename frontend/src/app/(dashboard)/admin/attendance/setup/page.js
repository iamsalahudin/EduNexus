'use client'

import AttendanceSetupManagerView from '@/components/attendance/AttendanceSetupManagerView'

export default function AttendanceSetupPage() {
  return (
    <AttendanceSetupManagerView
      roleBase="/admin"
      backHref="/admin/attendance"
      title="Attendance Setup"
      subtitle="Assign teachers to class and section pairs for class-attendance control."
    />
  )
}

