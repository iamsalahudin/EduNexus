"use client"

import { Button, Card, PageHeader } from '@/components/ui'

export default function Page() {
  return (
    <div>
      <PageHeader
        title="Results Notifications"
        subtitle="Notifications related to results publishing."
      />

      <Card className="mt-6">
        <div className="text-sm text-gray-600">Under construction.</div>
        <div className="mt-4">
          <Button type="button" onClick={() => (window.location.href = '/principal/results/report-cards')}>
            Back to Report Cards
          </Button>
        </div>
      </Card>
    </div>
  )
}
