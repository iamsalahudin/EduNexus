"use client"

import ExamSchedulePage from '@/components/exams/ExamSchedulePage'

export default function Page() {
  return (
    <ExamSchedulePage
      title="Exams"
      subtitle="View exam schedule and datesheet."
      canManage={false}
    />
  )
}
