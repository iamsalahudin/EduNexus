"use client"

import DatesheetGridPage from '@/components/exams/DatesheetGridPage'

export default function ExamSchedulesPage() {
  return (
    <DatesheetGridPage
      title="Exam Schedules"
      subtitle="Manage datesheets by class and date in a grid view."
      canManage
      baseRole="principal"
    />
  )
}
