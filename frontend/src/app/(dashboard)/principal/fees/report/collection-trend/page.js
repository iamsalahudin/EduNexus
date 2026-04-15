'use client'

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function PrincipalFeeCollectionTrendPage() {
  return (
    <FeeReportWorkspace
      mode="trend"
      roleBase="/principal"
      title="Collection Trend"
      subtitle="Monthly and yearly fee trend snapshot with search and exports."
      detailBasePath="/principal/fees"
      reportLinks={[
        { href: '/principal/fees/report', label: 'Report Hub', description: 'Back to fee reports.' },
        { href: '/principal/fees/report/records', label: 'Student Records', description: 'Search fee records.' },
        { href: '/principal/fees/report/defaulters', label: 'Defaulters', description: 'Outstanding dues and export actions.' }
      ]}
    />
  )
}