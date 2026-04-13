'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function GenerateSalaryPage() {
  return (
    <SalaryWorkspace
      roleBase="/principal"
      title="Generate Salary"
      subtitle="Generate monthly salary slips with deductions and advances applied."
      showStaffManagement={false}
      showStructureManagement={false}
      showGenerate
      allowPayments={false}
      reportHref="/principal/salary/report"
    />
  )
}