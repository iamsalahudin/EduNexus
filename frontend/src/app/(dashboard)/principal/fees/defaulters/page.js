"use client"

import FeeReportWorkspace from '@/components/fees/FeeReportWorkspace'

export default function FeeDefaulters() {
  return (
    <FeeReportWorkspace
      mode="defaulters"
      roleBase="/principal"
      title="Fee Defaulters"
      subtitle="Pending fee records with class and student search filters and full export options."
      detailBasePath="/principal/fees"
    />
  )
}
