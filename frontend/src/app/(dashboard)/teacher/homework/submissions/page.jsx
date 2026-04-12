'use client'

import HomeworkSubmissionsWorkspace from '@/components/homework/HomeworkSubmissionsWorkspace'

export default function HomeworkSubmissionsPage() {
  return (
    <HomeworkSubmissionsWorkspace
      title="Homework Submissions"
      subtitle="Track submissions for your assigned homework."
      roleBase="/teacher"
    />
  )
}
