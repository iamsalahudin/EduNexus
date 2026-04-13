'use client'

import HomeworkSubmissionsWorkspace from '@/components/homework/HomeworkSubmissionsWorkspace'

export default function HomeworkSubmissionsPage() {
  return (
    <HomeworkSubmissionsWorkspace
      title="Homework Submissions"
      subtitle="Principal submission tracker for class sections."
      roleBase="/principal"
      requireClassSection
    />
  )
}
