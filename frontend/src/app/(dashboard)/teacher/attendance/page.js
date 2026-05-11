<<<<<<< HEAD
﻿"use client"

import { ButtonLink, Card, PageHeader } from '@/components/ui'
import StaffAttendanceRecordsView from '@/components/attendance/StaffAttendanceRecordsView'

export default function TeacherAttendanceDashboard() {
  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="View your own attendance and access student-marking tools from the same hub."
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Mark Class Attendance</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📝</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Quick access to mark attendance for your assigned class. View and update daily records.
          </p>
          <ButtonLink href="/teacher/attendance/mark" variant="primary" className="w-full">
            Mark Attendance Now
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">My Attendance</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">✓</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Mark your own daily attendance including present, absent, late, and leave status.
          </p>
          <ButtonLink href="/teacher/attendance/my" variant="primary" className="w-full">
            Open My Attendance
          </ButtonLink>
        </Card>
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

=======
﻿"use client"

import { ButtonLink, Card, PageHeader } from '@/components/ui'
import StaffAttendanceRecordsView from '@/components/attendance/StaffAttendanceRecordsView'

export default function TeacherAttendanceDashboard() {
  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="View your own attendance and access student-marking tools from the same hub."
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Mark Class Attendance</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📝</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Quick access to mark attendance for your assigned class. View and update daily records.
          </p>
          <ButtonLink href="/teacher/attendance/mark" variant="primary" className="w-full">
            Mark Attendance Now
          </ButtonLink>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">My Attendance</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">✓</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Mark your own daily attendance including present, absent, late, and leave status.
          </p>
          <ButtonLink href="/teacher/attendance/my" variant="primary" className="w-full">
            Open My Attendance
          </ButtonLink>
        </Card>
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

>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
