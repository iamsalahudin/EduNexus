'use client'

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function AdminFeeDefaultersReportPage() {
  return (
    <FeeReportWorkspace
      mode="defaulters"
      roleBase="/principal"
      title="Fee Defaulters"
      subtitle="View outstanding fee records with search, filters, and export actions."
      detailBasePath="/principal/fees"
    />
  )
}