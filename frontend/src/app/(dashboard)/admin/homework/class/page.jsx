'use client'

import HomeworkSubmissionsWorkspace from '@/components/homework/HomeworkSubmissionsWorkspace'

export default function ClassHomeworkPage() {
  return (
    <HomeworkSubmissionsWorkspace
      title="Class Homework"
      subtitle="Track assignments and statuses class-wise and section-wise."
      roleBase="/admin"
      requireClassSection
    />
  )
}
