"use client"

import ExamSchedulePage from '@/components/exams/ExamSchedulePage'

export default function Page() {
  return (
    <ExamSchedulePage
      title="Exams"
      subtitle="Published exam schedule and datesheet overview."
      canManage={false}
    />
  )
}
