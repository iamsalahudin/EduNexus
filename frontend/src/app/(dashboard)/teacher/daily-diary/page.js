"use client"

import DailyDiaryWorkspace from '@/components/homework/DailyDiaryWorkspace'

export default function TeacherDailyDiaryPage() {
  return (
    <DailyDiaryWorkspace
      title="Daily Diary"
      subtitle="Add and manage your class incharge daily diaries."
      canCreate
      canEdit
    />
  )
}
