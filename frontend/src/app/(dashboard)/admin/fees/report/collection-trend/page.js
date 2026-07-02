'use client'

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function AdminFeeCollectionTrendPage() {
  return (
    <FeeReportWorkspace
      mode="trend"
      roleBase="/admin"
      title="Collection Trend"
      subtitle="Monthly and yearly fee trend snapshot with search and exports."
      detailBasePath="/admin/fees"
    />
  )
}