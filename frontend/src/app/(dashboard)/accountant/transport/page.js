import { Card, PageHeader } from '@/components/ui'

export default function Page() {

  return (
    <div className="space-y-6">
      <PageHeader title="Transport" subtitle="View transport context linked to finance reporting." />
      <Card>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Transport enrollment, requests, and payments are managed by Admin, Principal, and Reception.</p>
          <p>Use the fees and reports sections for transport-related finance visibility.</p>
        </div>
      </Card>
    </div>
  )
}
