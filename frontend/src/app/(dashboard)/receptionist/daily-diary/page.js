"use client"

import DailyDiaryWorkspace from '@/components/homework/DailyDiaryWorkspace'

export default function ReceptionDailyDiaryPage() {
  return (
    <DailyDiaryWorkspace
      title="Daily Diary"
      subtitle="Class-based create, read, and update daily diaries."
      canCreate
      canEdit
      readOnly
    />
  )
}
