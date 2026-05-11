<<<<<<< HEAD
"use client"

import Link from 'next/link'
import StudentAttendanceRecordsView from '@/components/attendance/StudentAttendanceRecordsView'

export default function ReceptionistStudentAttendanceView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Link href="/receptionist/attendance" className="px-3 py-2 border rounded hover-theme-primary">
          Back to Attendance
        </Link>
      </div>
      <StudentAttendanceRecordsView 
        title="Student Attendance Records"
        description="View student attendance by class and date range. Use filters to find specific records."
        showClassFilter={true}
      />
    </div>
  )
}
=======
"use client"

import Link from 'next/link'
import StudentAttendanceRecordsView from '@/components/attendance/StudentAttendanceRecordsView'

export default function ReceptionistStudentAttendanceView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Link href="/receptionist/attendance" className="px-3 py-2 border rounded hover-theme-primary">
          Back to Attendance
        </Link>
      </div>
      <StudentAttendanceRecordsView 
        title="Student Attendance Records"
        description="View student attendance by class and date range. Use filters to find specific records."
        showClassFilter={true}
      />
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
