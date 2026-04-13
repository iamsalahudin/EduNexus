'use client'

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function PrincipalFeeRecordsReportPage() {
  return (
    <FeeReportWorkspace
      mode="records"
      roleBase="/principal"
      title="Student Fee Records"
      subtitle="Search and export class-based fee records with monthly and yearly snapshots."
      detailBasePath="/principal/fees"
      reportLinks={[
        { href: '/principal/fees/report', label: 'Report Hub', description: 'Back to fee reports.' },
        { href: '/principal/fees/report/collection-trend', label: 'Collection Trend', description: 'Monthly and yearly fee snapshots.' },
        { href: '/principal/fees/report/defaulters', label: 'Defaulters', description: 'Outstanding dues and export actions.' }
      ]}
    />
  )
}