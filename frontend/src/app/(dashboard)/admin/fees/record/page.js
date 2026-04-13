"use client"

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function FeeRecord() {
  return (
    <FeeReportWorkspace
      mode="records"
      roleBase="/admin"
      title="Fee Record"
      subtitle="Class-based and student-search fee records with monthly and yearly snapshot plus exports."
      reportLinks={[
        { href: '/admin/fees/report', label: 'Reports Hub', description: 'Open all fee report types.' },
        { href: '/admin/fees/defaulters', label: 'Defaulters', description: 'View pending dues list.' },
        { href: '/admin/fees/collection', label: 'Collection', description: 'Update paid/unpaid status.' }
      ]}
      detailBasePath="/admin/fees"
    />
  )
}
