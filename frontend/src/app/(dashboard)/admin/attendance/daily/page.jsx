"use client"

import DailyStudentAttendanceView from '@/components/attendance/DailyStudentAttendanceView'

export default function DailyStudentAttendancePage() {
  return (
    <DailyStudentAttendanceView
      backHref="/admin/attendance"
      title="Daily Student Attendance"
      subtitle="View and manage student attendance for a specific date by class and section."
    />
  )
}
