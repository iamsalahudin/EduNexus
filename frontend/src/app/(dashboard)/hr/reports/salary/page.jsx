'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryReportsPage() {
  return (
    <SalaryWorkspace
      roleBase="/hr"
      title="Salary Reports"
      subtitle="View salary reports and financial analytics with export support."
      showStaffManagement={false}
      showStructureManagement={false}
      showGenerate={false}
      allowPayments={false}
    />
  )
}
