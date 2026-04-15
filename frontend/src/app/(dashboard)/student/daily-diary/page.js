"use client"

import DailyDiaryWorkspace from '@/components/homework/DailyDiaryWorkspace'

export default function StudentDailyDiaryPage() {
  return (
    <DailyDiaryWorkspace
      title="Daily Diary"
      subtitle="View published daily diaries for your class and section."
      readOnly
    />
  )
}
