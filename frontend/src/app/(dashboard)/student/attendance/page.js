"use client"

import StudentAttendanceRecordsView from '@/components/attendance/StudentAttendanceRecordsView'

export default function StudentAttendancePage() {
  return (
    <div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-600">Auto-loaded personal attendance with monthly and yearly summaries.</p>
      </div>

      <div className="mt-6">
        <StudentAttendanceRecordsView
          title="Attendance Records"
          description="Your complete attendance history with month, year, and custom range filters."
          showClassFilter={false}
        />
      </div>
    </div>
  )
}
