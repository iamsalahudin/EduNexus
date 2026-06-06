"use client"

import { Card, PageHeader } from '@/components/ui'
import StaffAttendanceRecordsView from '@/components/attendance/StaffAttendanceRecordsView'
import AttendanceActionCard from '@/components/attendance/AttendanceActionCard'

export default function TeacherAttendanceDashboard() {
  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="View your own attendance and access student-marking tools from the same hub."
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <AttendanceActionCard
          title="Mark Class Attendance"
          description="Quick access to mark attendance for your assigned class. View and update daily records."
          href="/teacher/attendance/mark"
          buttonLabel="Mark Attendance Now"
          icon="📝"
          iconClassName="bg-blue-100"
        />

        <AttendanceActionCard
          title="My Attendance"
          description="Mark your own daily attendance including present, absent, late, and leave status."
          href="/teacher/attendance/my"
          buttonLabel="Open My Attendance"
          icon="✓"
          iconClassName="bg-green-100"
        />
      </div>

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">My Attendance Records</h3>
        <StaffAttendanceRecordsView
          title="My Attendance"
          description="Auto-loaded teacher attendance with monthly, yearly, and custom range summaries."
        />
      </Card>
    </div>
  )
}

