"use client"

import ClassAttendanceView from '@/components/attendance/ClassAttendanceView'

export default function ClassAttendancePage() {
  return (
    <ClassAttendanceView
      backHref="/principal/attendance"
      title="Class-wise Attendance"
      subtitle="View attendance statistics by class and section."
    />
  )
}
