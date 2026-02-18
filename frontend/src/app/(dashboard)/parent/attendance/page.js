"use client"

import StudentAttendanceRecordsView from '@/components/attendance/StudentAttendanceRecordsView'

export default function Page() {
  return (
    <StudentAttendanceRecordsView
      title="Children Attendance"
      description="View attendance records for your linked children."
      showClassFilter={false}
    />
  )
}
