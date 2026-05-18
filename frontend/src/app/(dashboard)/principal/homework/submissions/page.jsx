'use client'

import HomeworkSubmissionsWorkspace from '@/components/homework/HomeworkSubmissionsWorkspace'

export default function HomeworkSubmissionsPage() {
  return (
    <HomeworkSubmissionsWorkspace
      title="Homework Submissions"
      subtitle="Review class-wise submissions and grading progress."
      roleBase="/principal"
      requireClassSection
    />
  )
}
