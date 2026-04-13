"use client"

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function FeeDefaulters() {
  return (
    <FeeReportWorkspace
      mode="defaulters"
      roleBase="/admin"
      title="Fee Defaulters"
      subtitle="Pending fee records with class and student search filters and full export options."
      reportLinks={[
        { href: '/admin/fees/report', label: 'Reports Hub', description: 'Open all fee report types.' },
        { href: '/admin/fees/record', label: 'Records', description: 'Browse complete fee record list.' },
        { href: '/admin/fees/collection', label: 'Collection', description: 'Resolve dues by status updates.' }
      ]}
      detailBasePath="/admin/fees"
    />
  )
}
