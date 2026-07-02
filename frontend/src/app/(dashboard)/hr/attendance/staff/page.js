"use client"

import Link from 'next/link'
import StaffAttendanceRecordsView from '@/components/attendance/StaffAttendanceRecordsView'

export default function HRStaffAttendanceView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Link href="/hr/attendance" className="px-3 py-2 border rounded hover-theme-primary">
          Back to Attendance
        </Link>
      </div>
      <StaffAttendanceRecordsView 
        title="Teacher Attendance Records"
        description="View teacher daily attendance and monthly/yearly summaries with downloads."
        roleFilter="Teacher"
      />
    </div>
  )
}
