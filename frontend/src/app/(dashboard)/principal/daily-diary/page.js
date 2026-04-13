"use client"

import DailyDiaryWorkspace from '@/components/homework/DailyDiaryWorkspace'

export default function PrincipalDailyDiaryPage() {
  return (
    <DailyDiaryWorkspace
      title="Daily Diary Audit"
      subtitle="Principal audit and edit view for daily diaries by class and subject."
      canCreate
      canEdit
    />
  )
}
