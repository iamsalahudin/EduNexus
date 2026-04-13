"use client"

import DatesheetGridPage from '@/components/exams/DatesheetGridPage'

export default function Page() {
  return (
    <DatesheetGridPage
      title="Exams Schedule"
      subtitle="View and edit datesheets in a classes × dates grid."
      canManage
      baseRole="principal"
    />
  )
}
