"use client"

import Link from 'next/link'
import StaffAttendanceRecordsView from '@/components/attendance/StaffAttendanceRecordsView'

export default function HRStaffAttendanceView(){
  return (
    <div>
      <div className="flex items-center justify-between">
        <div />
        <Link href="/hr/attendance" className="px-3 py-2 rounded btn-secondary">Back</Link>
      </div>
      <StaffAttendanceRecordsView />
    </div>
  )
}

