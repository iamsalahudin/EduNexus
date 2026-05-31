"use client"

import DailyDiaryWorkspace from '@/components/homework/DailyDiaryWorkspace'

export default function AdminDailyDiaryPage() {
  return (
    <DailyDiaryWorkspace
      title="Daily Diary Audit"
      subtitle="Track, audit, and edit class-wise subject diaries."
      canCreate
      canEdit
    />
  )
}
