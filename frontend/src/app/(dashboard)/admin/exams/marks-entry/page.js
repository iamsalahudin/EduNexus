"use client"

import MarksEntryPage from '@/components/exams/MarksEntryPage'

export default function Page() {
  return (
    <MarksEntryPage
      title="Marks Entry (Admin)"
      subtitle="Admin can view/edit marks for all classes."
      mode="admin"
    />
  )
}
