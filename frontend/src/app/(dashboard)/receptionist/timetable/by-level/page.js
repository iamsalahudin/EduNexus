'use client'

import TimetableOverviewPanel from '@/components/timetable/TimetableOverviewPanel'

export default function ReceptionistTimetableByLevelPage() {
  return <TimetableOverviewPanel roleBase="/receptionist" canCreate={false} />
}
