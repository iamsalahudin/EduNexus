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
      reportLinks={[
        { href: '/admin/fees/report', label: 'Report Hub', description: 'Back to fee reports.' },
        { href: '/admin/fees/report/records', label: 'Student Records', description: 'Search fee records.' },
        { href: '/admin/fees/report/defaulters', label: 'Defaulters', description: 'Outstanding dues and export actions.' }
      ]}
    />
  )
}