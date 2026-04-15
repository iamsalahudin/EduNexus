'use client'

export default function FinanceReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Reports</h1>
        <p className="text-gray-600 mt-2">Fee credit and liability analytics references for finance review.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/admin/fees/report" className="rounded-lg border bg-white p-4 hover-theme-primary">Fee Reports Hub</a>
        <a href="/admin/fees/record" className="rounded-lg border bg-white p-4 hover-theme-primary">Fee Records Reference</a>
        <a href="/admin/fees/defaulters" className="rounded-lg border bg-white p-4 hover-theme-primary">Defaulters Reference</a>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        Downloads are performed from fee report pages. Finance reports use those outputs as references.
      </div>
    </div>
  )
}
