'use client'

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function AdminFeeDefaultersReportPage() {
  return (
    <FeeReportWorkspace
      mode="defaulters"
      roleBase="/admin"
      title="Fee Defaulters"
      subtitle="View outstanding fee records with search, filters, and export actions."
      detailBasePath="/admin/fees"
      reportLinks={[
        { href: '/admin/fees/report', label: 'Report Hub', description: 'Back to fee reports.' },
        { href: '/admin/fees/report/collection-trend', label: 'Collection Trend', description: 'Monthly and yearly fee snapshots.' },
        { href: '/admin/fees/report/records', label: 'Student Records', description: 'Search fee records.' }
      ]}
    />
  )
}