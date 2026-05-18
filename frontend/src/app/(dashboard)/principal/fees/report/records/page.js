'use client'

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function AdminFeeRecordsReportPage() {
  return (
    <FeeReportWorkspace
      mode="records"
      roleBase="/principal"
      title="Student Fee Records"
      subtitle="Search and export class-based fee records with monthly and yearly snapshots."
      detailBasePath="/principal/fees"
    />
  )
}