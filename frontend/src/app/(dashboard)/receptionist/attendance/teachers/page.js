"use client"

import Link from 'next/link'
import TeacherAttendanceManagerView from '@/components/attendance/TeacherAttendanceManagerView'

export default function ReceptionistTeacherAttendancePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Link href="/receptionist/attendance" className="px-3 py-2 border rounded hover-theme-primary">
          Back to Attendance
        </Link>
      </div>

      <TeacherAttendanceManagerView
        roleBase="/receptionist"
        backHref="/receptionist/attendance"
        title="Teacher Attendance"
        subtitle="Mark daily teacher attendance and review teacher-wise history."
        allowUpdateExisting={false}
        detailHrefBuilder={(teacherId) => `/receptionist/teachers/profile/${teacherId}`}
      />
    </div>
  )
}
