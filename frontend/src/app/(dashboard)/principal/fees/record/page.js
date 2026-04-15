"use client"

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function FeeRecord() {
  return (
    <FeeReportWorkspace
      mode="records"
      roleBase="/principal"
      title="Fee Record"
      subtitle="Class-based and student-search fee records with monthly and yearly snapshot plus exports."
      reportLinks={[
        { href: '/principal/fees/report', label: 'Reports Hub', description: 'Open all fee report types.' },
        { href: '/principal/fees/defaulters', label: 'Defaulters', description: 'View pending dues list.' },
        { href: '/principal/fees/collection', label: 'Collection', description: 'Update paid/unpaid status.' }
      ]}
      detailBasePath="/principal/fees"
    />
  )
}
