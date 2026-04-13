'use client'

export default function FeesOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fees</h1>
        <p className="text-gray-600 mt-2">Update paid and unpaid status for generated monthly fees and review fee records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/receptionist/fees/collection" className="rounded-lg border bg-white p-4 hover-theme-primary">Mark Fee Status</a>
        <a href="/receptionist/fees/defaulters" className="rounded-lg border bg-white p-4 hover-theme-primary">Defaulters</a>
        <a href="/receptionist/fees/vouchers" className="rounded-lg border bg-white p-4 hover-theme-primary">Fee Reports & Vouchers</a>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        Reception can update only fee payment status. Amount values remain system-generated and are not editable on this surface.
      </div>
    </div>
  )
}
