"use client"

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function FeeRecord() {
  return (
    <FeeReportWorkspace
      mode="records"
      roleBase="/admin"
      title="Fee Record"
      subtitle="Class-based and student-search fee records with monthly and yearly snapshot plus exports."
      detailBasePath="/admin/fees"
    />
  )
}
