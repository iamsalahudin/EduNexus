'use client'

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function AdminFeeCollectionTrendPage() {
  return (
    <FeeReportWorkspace
      mode="trend"
      roleBase="/principal"
      title="Collection Trend"
      subtitle="Monthly and yearly fee trend snapshot with search and exports."
      detailBasePath="/principal/fees"
    />
  )
}