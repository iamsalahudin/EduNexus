'use client'

import { ButtonLink, Card, PageHeader } from '@/components/ui'

export default function CreateHomeworkPage() {
  return (
    <div>
      <PageHeader
        title="Homework Assignment Control"
        subtitle="Teachers create assignments; admin monitors quality, submission flow, and compliance."
        right={<ButtonLink href="/admin/homework">Open Homework Tracker</ButtonLink>}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Who Creates Homework</div>
          <div className="font-semibold mt-1">Teacher role</div>
          <p className="text-sm text-gray-700 mt-3">
            Assignment creation is restricted to teachers to keep subject ownership and class accountability clear.
          </p>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Admin Scope</div>
          <div className="font-semibold mt-1">Audit and intervention</div>
          <p className="text-sm text-gray-700 mt-3">
            Use the monitoring pages to review assignment quality, track submission performance, and step in when needed.
          </p>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Recommended Flow</div>
          <div className="font-semibold mt-1">Class to Submissions to Detail</div>
          <p className="text-sm text-gray-700 mt-3">
            Start from class-level coverage, then drill into submission summaries and inspect individual homework records.
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-medium">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <ButtonLink href="/admin/homework/class" variant="outline">Class Coverage</ButtonLink>
          <ButtonLink href="/admin/homework/submissions" variant="outline">Submission Audit</ButtonLink>
          <ButtonLink href="/admin/homework" variant="outline">Homework Tracker</ButtonLink>
        </div>
      </Card>
    </div>
  )
}
