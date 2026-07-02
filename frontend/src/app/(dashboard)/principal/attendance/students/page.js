"use client"

import StudentAttendanceUpdateManagerView from '@/components/attendance/StudentAttendanceUpdateManagerView'

export default function AdminStudentAttendancePage() {
  return (
    <StudentAttendanceUpdateManagerView
      roleBase="/principal"
      title="Student Attendance"
      subtitle="Update existing student attendance records by class and date."
    />
  )
}
