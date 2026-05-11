'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryPage() {
  return (
    <SalaryWorkspace
      roleBase="/principal"
      title="Salary Overview"
      subtitle="View salary setup, records, reports, slips, and monthly generation without finance-only references."
      showStaffManagement
      showStructureManagement
      showGenerate
      allowPayments
      reportHref="/principal/salary/report"
    />
  )
}
