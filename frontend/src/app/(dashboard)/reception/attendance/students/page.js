"use client"

import Link from 'next/link'
import StudentAttendanceRecordsView from '@/components/attendance/StudentAttendanceRecordsView'

export default function ReceptionStudentAttendanceView(){
  return (
    <div>
      <div className="flex items-center justify-between">
        <div />
        <Link href="/reception/attendance" className="px-3 py-2 rounded btn-secondary">Back</Link>
      </div>
      <StudentAttendanceRecordsView />
    </div>
  )
}


