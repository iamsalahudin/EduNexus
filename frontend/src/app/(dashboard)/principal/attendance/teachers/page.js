"use client"

import TeacherAttendanceManagerView from '@/components/attendance/TeacherAttendanceManagerView'

export default function AdminTeacherAttendancePage() {
  return (
    <TeacherAttendanceManagerView
      roleBase="/principal"
      backHref="/principal/attendance"
      detailHrefBuilder={(teacherId) => `/principal/attendance/teachers/profile/${teacherId}`}
      title="Teacher Attendance Management"
      subtitle="Day-wise and teacher-wise mark and update for teacher attendance records."
    />
  )
}

