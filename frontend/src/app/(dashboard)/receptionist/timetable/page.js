'use client'

import TimetableOverviewPanel from '@/components/timetable/TimetableOverviewPanel'

export default function ReceptionistTimetablePage() {
  return <TimetableOverviewPanel roleBase="/receptionist" canCreate={false} />
}
