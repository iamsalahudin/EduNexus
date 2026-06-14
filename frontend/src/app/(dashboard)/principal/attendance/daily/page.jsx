"use client"

import PageHeader from '@/components/ui/PageHeader'
import ButtonLink from '@/components/ui/ButtonLink'
import DailyStudentAttendanceView from '@/components/attendance/DailyStudentAttendanceView'

export default function DailyStudentAttendancePage() {
  
  return (
    <DailyStudentAttendanceView
      roleBase="/principal"
      backHref="/principal/attendance"
      title="Daily Student Attendance"
      subtitle="View and manage student attendance for a specific date by class and section."
    />
  )
}
