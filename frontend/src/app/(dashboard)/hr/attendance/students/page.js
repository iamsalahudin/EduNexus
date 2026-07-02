"use client"

import Link from 'next/link'
import StudentAttendanceRecordsView from '@/components/attendance/StudentAttendanceRecordsView'

export default function HRStudentAttendanceView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Link href="/hr/attendance" className="px-3 py-2 border rounded hover-theme-primary">
          Back to Attendance
        </Link>
      </div>
      <StudentAttendanceRecordsView 
        title="Student Attendance Records"
        description="View and monitor student attendance across all classes and sections. Filter by class and date range to analyze attendance patterns."
        showClassFilter={true}
      />
    </div>
  )
}
