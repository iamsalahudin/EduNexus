"use client"

import ExamLifecycleWorkspace from '@/components/exams/ExamLifecycleWorkspace'

export default function ExamMarksManagementPage() {
  return (
    <ExamLifecycleWorkspace
      title="Exam Lifecycle"
      subtitle="Track state transitions, archive records, and finalize publication."
      baseRole="admin"
      setupHref="/admin/exams/add"
    />
  )
}
