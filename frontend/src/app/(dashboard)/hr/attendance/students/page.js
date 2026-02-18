"use client"

import Link from 'next/link'
import StudentAttendanceRecordsView from '@/components/attendance/StudentAttendanceRecordsView'

export default function HRStudentAttendanceView(){
  return (
    <div>
      <div className="flex items-center justify-between">
        <div />
        <Link href="/hr/attendance" className="px-3 py-2 border rounded hover-theme-primary">Back</Link>
      </div>
      <StudentAttendanceRecordsView />
    </div>
  )
}
