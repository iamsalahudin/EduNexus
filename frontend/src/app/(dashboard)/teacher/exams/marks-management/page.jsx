"use client"

import { ButtonLink, Card, PageHeader } from '@/components/ui'

export default function MarksManagementPage() {
  return (
    <div>
      <PageHeader
        title="Marks Management"
        subtitle="Teachers can enter marks for assigned subjects and monitor submission readiness."
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Primary Action</div>
          <div className="font-semibold mt-1">Marks Entry</div>
          <p className="text-sm text-gray-700 mt-3">Enter and update marks during open upload windows for your assigned classes.</p>
          <div className="mt-4"><ButtonLink href="/teacher/exams/marks-entry">Open Marks Entry</ButtonLink></div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600">Schedule View</div>
          <div className="font-semibold mt-1">Datesheet Reference</div>
          <p className="text-sm text-gray-700 mt-3">Check datesheet context before final marks submission to avoid mismatches.</p>
          <div className="mt-4"><ButtonLink href="/teacher/exams/schedule" variant="outline">Open Schedule</ButtonLink></div>
        </Card>

        <Card>
          <div className="text-sm text-gray-600">Permission Note</div>
          <div className="font-semibold mt-1">Read and submit only</div>
          <p className="text-sm text-gray-700 mt-3">Exam creation, approval, publish, and archive actions are reserved for Admin and Principal.</p>
        </Card>
      </div>
    </div>
  )
}
