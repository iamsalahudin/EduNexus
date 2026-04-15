"use client"

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function FeeDefaulters() {
  return (
    <FeeReportWorkspace
      mode="defaulters"
      roleBase="/principal"
      title="Fee Defaulters"
      subtitle="Pending fee records with class and student search filters and full export options."
      reportLinks={[
        { href: '/principal/fees/report', label: 'Reports Hub', description: 'Open all fee report types.' },
        { href: '/principal/fees/record', label: 'Records', description: 'Browse complete fee record list.' },
        { href: '/principal/fees/collection', label: 'Collection', description: 'Resolve dues by status updates.' }
      ]}
      detailBasePath="/principal/fees"
    />
  )
}
