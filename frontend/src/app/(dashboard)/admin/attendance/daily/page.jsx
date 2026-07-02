'use client'

import DailyStudentAttendanceView from '@/components/attendance/DailyStudentAttendanceView'

export default function AdminDailyAttendancePage() {
  return (
    <DailyStudentAttendanceView
      title="Daily Attendance"
      subtitle="Mark and review student attendance for a specific date by class and section."
      backHref="/admin/attendance"
    />
  )
}
