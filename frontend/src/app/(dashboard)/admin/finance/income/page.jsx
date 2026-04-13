'use client'
import { useEffect, useState } from 'react'
import { fetchFeesSummary } from '@/services/feesService'

export default function IncomeManagementPage() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    let mounted = true
    fetchFeesSummary().then((res) => {
      if (mounted) setSummary(res)
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Income Management</h1>
        <p className="text-gray-600 mt-2">Fee-related income references are shown here as finance credits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">Fee Credit This Month</div>
          <div className="text-xl font-semibold mt-1">Rs {summary?.totalCollected ?? '...'}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-600">Pending Liability Count</div>
          <div className="text-xl font-semibold mt-1">{summary?.pendingCount ?? '...'}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        Source: fees module aggregates. Operations remain under fees pages; this section is reference-only.
      </div>
    </div>
  )
}
