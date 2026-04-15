'use client'

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function PrincipalFeeDefaultersReportPage() {
  return (
    <FeeReportWorkspace
      mode="defaulters"
      roleBase="/principal"
      title="Fee Defaulters"
      subtitle="View outstanding fee records with search, filters, and export actions."
      detailBasePath="/principal/fees"
      reportLinks={[
        { href: '/principal/fees/report', label: 'Report Hub', description: 'Back to fee reports.' },
        { href: '/principal/fees/report/collection-trend', label: 'Collection Trend', description: 'Monthly and yearly fee snapshots.' },
        { href: '/principal/fees/report/records', label: 'Student Records', description: 'Search fee records.' }
      ]}
    />
  )
}