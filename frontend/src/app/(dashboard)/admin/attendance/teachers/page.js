"use client"

import TeacherAttendanceManagerView from '@/components/attendance/TeacherAttendanceManagerView'

export default function AdminTeacherAttendancePage() {
  return (
    <TeacherAttendanceManagerView
      roleBase="/admin"
      backHref="/admin/attendance"
      detailHrefBuilder={(teacherId) => `/admin/attendance/teachers/profile/${teacherId}`}
      title="Teacher Attendance Management"
      subtitle="Day-wise and teacher-wise mark and update for teacher attendance records."
    />
  )
}

