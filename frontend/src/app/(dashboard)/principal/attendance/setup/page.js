'use client'

import AttendanceSetupManagerView from '@/components/attendance/AttendanceSetupManagerView'

export default function PrincipalAttendanceSetupPage() {
  return (
    <AttendanceSetupManagerView
      roleBase="/principal"
      backHref="/principal/attendance"
      title="Attendance Setup"
      subtitle="Assign teachers to class and section pairs for class-attendance control."
    />
  )
}