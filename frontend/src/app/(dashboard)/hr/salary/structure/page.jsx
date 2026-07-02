'use client'

import SalaryWorkspace from '@/components/salary/SalaryWorkspace'

export default function SalaryStructurePage() {
  return (
    <SalaryWorkspace
      roleBase="/hr"
      title="Salary Structure"
      subtitle="Create and maintain salary structures for teachers and salary-only staff."
      showStaffManagement={false}
      showStructureManagement
      showGenerate={false}
      allowPayments={false}
      reportHref="/hr/reports/salary"
    />
  )
}