'use client'

import useSWR from 'swr'
import FeeReportHub from '@/components/fees/FeeReportHub'
import { fetchFeesSummary } from '@/services/feesService'

export default function AdminFeeReportPage() {
  const { data, mutate } = useSWR('admin-fees-summary', fetchFeesSummary)

  return (
    <FeeReportHub
      roleBase="/principal"
      title="Fee Reports"
      subtitle="Navigate across collection trend, student records, and defaulter reports."
      summary={data}
      onRefresh={mutate}
      reportLinks={[
        { href: '/principal/fees/report/collection-trend', label: 'Collection Trend', description: 'Monthly and yearly fee snapshots.' },
        { href: '/principal/fees/report/records', label: 'Student Records', description: 'Searchable fee record table.' },
        { href: '/principal/fees/report/defaulters', label: 'Defaulters', description: 'Outstanding dues and export actions.' }
      ]}
    />
  )
}
