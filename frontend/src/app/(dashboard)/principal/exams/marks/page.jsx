"use client"

import ExamLifecycleWorkspace from '@/components/exams/ExamLifecycleWorkspace'

export default function ExamMarksPage() {
  return (
    <ExamLifecycleWorkspace
      title="Exam Lifecycle"
      subtitle="Review progression, approve transitions, and manage archive records."
      baseRole="principal"
      setupHref="/principal/exams"
    />
  )
}
