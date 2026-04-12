"use client"

import MarksEntryPage from '@/components/exams/MarksEntryPage'

export default function Page() {
  return (
    <MarksEntryPage
      title="Marks Entry"
      subtitle="You can edit marks only for your assigned class/section/subject (from timetable), and only while the window is open."
      mode="teacher"
    />
  )
}
