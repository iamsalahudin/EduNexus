"use client"

import ExamSchedulePage from '@/components/exams/ExamSchedulePage'

export default function Page() {
  return (
    <ExamSchedulePage
      title="Exams"
      subtitle="View exam schedule and datesheet. Enter marks for your assigned subjects when the window is open."
      canManage={false}
      marksEntryHref="/teacher/exams/marks-entry"
    />
  )
}
