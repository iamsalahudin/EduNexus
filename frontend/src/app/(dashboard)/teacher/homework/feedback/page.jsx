'use client'

import HomeworkSubmissionsWorkspace from '@/components/homework/HomeworkSubmissionsWorkspace'

export default function HomeworkFeedbackPage() {
  return (
    <HomeworkSubmissionsWorkspace
      title="Homework Feedback"
      subtitle="Focus on received/returned submissions for grading and comments."
      roleBase="/teacher"
      feedbackOnly
    />
  )
}
