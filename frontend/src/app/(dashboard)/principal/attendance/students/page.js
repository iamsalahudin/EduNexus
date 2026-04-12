"use client"

import StudentAttendanceUpdateManagerView from '@/components/attendance/StudentAttendanceUpdateManagerView'

export default function PrincipalStudentAttendancePage() {
  return (
    <StudentAttendanceUpdateManagerView
      roleBase="/principal"
      title="Students Attendance"
      subtitle="Update existing student attendance records by class and date."
    />
  )
}
