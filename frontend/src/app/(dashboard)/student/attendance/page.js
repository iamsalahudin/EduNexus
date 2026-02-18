"use client"

import StudentAttendanceRecordsView from '@/components/attendance/StudentAttendanceRecordsView'

export default function Page() {
  return (
    <StudentAttendanceRecordsView
      title="My Attendance"
      description="View your attendance records."
      showClassFilter={false}
    />
  )
}
