"use client"

import Link from 'next/link'
import StaffAttendanceRecordsView from '@/components/attendance/StaffAttendanceRecordsView'

export default function PrincipalStaffAttendanceView() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div />
        <Link href="/principal/attendance" className="px-3 py-2 border rounded hover-theme-primary">Back</Link>
      </div>
      <StaffAttendanceRecordsView />
    </div>
  )
}

